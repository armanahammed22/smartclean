
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, addDoc, where } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Trash2,
  Loader2,
  Zap,
  FileText,
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  Plus,
  X,
  User,
  MapPin,
  Package,
  Wallet,
  Smartphone,
  ChevronDown
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
} from "@/components/ui/dialog";
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

export default function OrdersManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [pricing, setPricing] = useState({ discount: 0, delivery: 80 });
  
  // Payment State
  const [paymentCategory, setPaymentCategory] = useState<'cod' | 'online'>('cod');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
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

  const filteredOrders = orders?.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allProducts?.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
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
    const subtotal = selectedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const total = subtotal + pricing.delivery - pricing.discount;
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  const handleCreateOrder = async () => {
    if (!db) return;
    if (selectedItems.length === 0 || !customer.name || !customer.phone || !customer.address) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "সবগুলো ঘর সঠিকভাবে পূরণ করুন।" });
      return;
    }

    if (paymentCategory === 'online' && !selectedGatewayId) {
      toast({ variant: "destructive", title: "Payment Method Error", description: "Please select an online gateway." });
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
        subtotal,
        discount: pricing.discount,
        deliveryCharge: pricing.delivery,
        totalPrice: total,
        paymentMethod: paymentCategory === 'cod' ? 'Cash on Delivery' : (selectedGateway?.name || 'Online'),
        status: 'New',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      await getOrCreateInvoice(db, docRef.id, 'order', orderData);

      toast({ title: "সফল হয়েছে", description: "নতুন অর্ডার তৈরি হয়েছে!" });
      setIsCreateOpen(false);
      setSelectedItems([]);
      setCustomer({ name: '', phone: '', address: '' });
      setPaymentCategory('cod');
      setSelectedGatewayId('');
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

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#081621]">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground text-sm font-medium">পণ্য বিক্রয় এবং ডেলিভারি ট্র্যাকিং</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-black gap-2 h-11 px-6 shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">
          <Plus size={18} /> নতুন অর্ডার
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "মোট অর্ডার", val: stats.total, icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "প্রসেসিং", val: stats.processing, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "ডেলিভারড", val: stats.delivered, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "আজকের আয়", val: `৳${stats.daily.toLocaleString()}`, icon: Zap, bg: "bg-primary/5", color: "text-primary" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="অর্ডার আইডি বা নাম দিয়ে খুঁজুন..." 
              className="pl-10 h-11 bg-white border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
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
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filteredOrders?.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="font-black text-gray-900 text-xs">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                    <div className="text-[9px] text-muted-foreground mt-1 font-bold">{mounted && order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : 'N/A'}</div>
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
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenInvoice(order)} disabled={isProcessingInvoice === order.id}><FileText size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'orders', order.id))}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE ORDER DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
          <div className="flex flex-col h-[85vh]">
            <header className="p-6 bg-[#081621] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl"><ShoppingCart size={24} /></div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">নতুন অর্ডার</DialogTitle>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">পণ্য নির্বাচন</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input 
                        placeholder="সার্চ করুন..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold"
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
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">গ্রাহকের তথ্য</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="নাম" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      <Input placeholder="ফোন" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <Textarea placeholder="ঠিকানা" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="bg-gray-50 border-none rounded-xl min-h-[80px]" />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-6 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col gap-8 h-fit">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Wallet size={16} /> সারসংক্ষেপ</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span></div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">ডেলিভারি চার্জ</Label>
                        <Input type="number" value={pricing.delivery} onChange={e => setPricing({...pricing, delivery: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">ডিসকাউন্ট</Label>
                        <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black text-red-600" />
                      </div>
                      <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-400">মোট প্রদেয়</span>
                          <span className="text-4xl font-black text-primary tracking-tighter">৳{total.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">BDT</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">পেমেন্ট মেথড</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPaymentCategory('cod')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'cod' ? "border-primary bg-primary/5" : "bg-white border-gray-100 opacity-60")}
                      >
                        <Package size={20} className={paymentCategory === 'cod' ? "text-primary" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase">Cash on Delivery</span>
                      </div>
                      <div 
                        onClick={() => setPaymentCategory('online')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'online' ? "border-blue-600 bg-blue-50" : "bg-white border-gray-100 opacity-60")}
                      >
                        <Smartphone size={20} className={paymentCategory === 'online' ? "text-blue-600" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase">Online Payment</span>
                      </div>
                    </div>

                    {paymentCategory === 'online' && (
                      <div className="space-y-3 pt-2 animate-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase text-blue-600 ml-1">সিলেক্ট গেটওয়ে</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {activeGateways?.filter(g => g.type !== 'cod' && g.type !== 'cash').map(gateway => (
                            <div 
                              key={gateway.id}
                              onClick={() => setSelectedGatewayId(gateway.id)}
                              className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer",
                                selectedGatewayId === gateway.id ? "border-blue-600 bg-white" : "border-gray-100 bg-gray-50/50"
                              )}
                            >
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                                {gateway.logoUrl ? <Image src={gateway.logoUrl} alt={gateway.name} fill className="object-contain p-1" unoptimized /> : <Wallet size={16} className="m-auto text-gray-300" />}
                              </div>
                              <span className="text-xs font-bold uppercase flex-1">{gateway.name}</span>
                              {selectedGatewayId === gateway.id && <CheckCircle2 size={16} className="text-blue-600" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleCreateOrder} disabled={isSubmitting} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 uppercase tracking-tight gap-2 transition-transform active:scale-95">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "অর্ডার নিশ্চিত করুন"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
