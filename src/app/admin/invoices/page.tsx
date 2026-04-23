'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, writeBatch, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  Loader2, 
  Filter, 
  ReceiptText, 
  Wallet, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Package,
  Smartphone,
  Info,
  Calculator,
  User,
  Save
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function InvoicesListContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Manual Invoice State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualItems, setManualItems] = useState<any[]>([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [pricing, setPricing] = useState({ discount: 0, delivery: 0, paymentStatus: 'Unpaid', paymentMethod: 'Cash' });

  const invoicesQuery = useMemoFirebase(() => db ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  // Dynamic KPIs
  const stats = useMemo(() => {
    if (!invoices) return { total: 0, paid: 0, unpaid: 0, totalRev: 0, due: 0 };
    return {
      total: invoices.length,
      paid: invoices.filter(i => i.paymentStatus === 'Paid').length,
      unpaid: invoices.filter(i => i.paymentStatus !== 'Paid').length,
      totalRev: invoices.filter(i => i.paymentStatus === 'Paid').reduce((acc, i) => acc + (i.total || 0), 0),
      due: invoices.filter(i => i.paymentStatus !== 'Paid').reduce((acc, i) => acc + (i.total || 0), 0)
    };
  }, [invoices]);

  const filtered = invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered?.map(i => i.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (status: 'Paid' | 'Unpaid') => {
    if (!db || selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'invoices', id), { paymentStatus: status });
      });
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Status Updated" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm("Delete selected invoices permanently?")) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'invoices', id));
      });
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Deleted Successfully" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Manual Invoice Logic
  const addManualItem = () => setManualItems([...manualItems, { name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const removeManualItem = (idx: number) => setManualItems(manualItems.filter((_, i) => i !== idx));
  const updateManualItem = (idx: number, field: string, val: any) => {
    const next = [...manualItems];
    next[idx][field] = val;
    setManualItems(next);
  };

  // 🧮 Automatic Real-time Calculations
  const subtotal = useMemo(() => {
    return manualItems.reduce((acc, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseFloat(item.quantity) || 1;
      return acc + (p * q);
    }, 0);
  }, [manualItems]);

  const tax = Number((subtotal * 0.08).toFixed(2));
  const totalAmount = Number((subtotal + tax + Number(pricing.delivery) - Number(pricing.discount)).toFixed(2));

  const handleCreateManualInvoice = async () => {
    if (!db) return;
    if (!customer.name || !customer.phone || manualItems.some(i => !i.name || !i.price)) {
      toast({ variant: "destructive", title: "Information Missing", description: "Customer name, phone and item details are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const countSnap = await getDocs(collection(db, 'invoices'));
      const invoiceNumber = `INV-MAN-${(countSnap.size + 1).toString().padStart(4, '0')}`;

      const invoiceData = {
        invoiceNumber,
        customerInfo: { ...customer },
        items: manualItems.map(i => ({ 
          id: 'manual-' + Math.random().toString(36).substr(2, 9),
          name: i.name, 
          price: parseFloat(i.price), 
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          type: i.type 
        })),
        subtotal,
        tax,
        discount: Number(pricing.discount),
        deliveryCharge: Number(pricing.delivery),
        total: totalAmount,
        paymentStatus: pricing.paymentStatus,
        paymentMethod: pricing.paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAmount: pricing.paymentStatus === 'Paid' ? totalAmount : 0,
        dueAmount: pricing.paymentStatus === 'Paid' ? 0 : totalAmount
      };

      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      const publicLink = `${window.location.origin}/invoice/view/${docRef.id}`;
      await updateDoc(doc(db, 'invoices', docRef.id), { publicLink });
      
      toast({ title: "Invoice Created", description: "Manual invoice has been registered." });
      setIsCreateOpen(false);
      setManualItems([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
      setCustomer({ name: '', phone: '', address: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Creating Invoice" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight leading-none">Billing Registry</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Monitor all service and product invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 border-gray-200 gap-2"><Download size={16} /> Export CSV</Button>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest bg-primary">
            <Plus size={18} /> Create Manual Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700 rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Volume</p>
              <h3 className="text-3xl font-black">{stats.total}</h3>
            </div>
            <ReceiptText size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50 text-green-700 rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Revenue</p>
              <h3 className="text-3xl font-black">৳{stats.totalRev.toLocaleString()}</h3>
            </div>
            <Wallet size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 text-red-700 rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Outstandings</p>
              <h3 className="text-3xl font-black">৳{stats.due.toLocaleString()}</h3>
            </div>
            <AlertCircle size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50 text-amber-700 rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Pending</p>
              <h3 className="text-3xl font-black">{stats.unpaid}</h3>
            </div>
            <Clock size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search Invoice # or Customer..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-black uppercase">{selectedIds.length} SELECTED</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatus('Paid')} disabled={isBulkProcessing} className="h-8 text-[9px] font-black uppercase">Mark Paid</Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatus('Unpaid')} disabled={isBulkProcessing} className="h-8 text-[9px] font-black uppercase">Mark Unpaid</Button>
            </div>
          </div>
          <Button variant="ghost" onClick={handleBulkDelete} disabled={isBulkProcessing} className="text-white hover:bg-red-500 font-black uppercase text-[9px]">
            <Trash2 size={14} className="mr-2" /> Delete Bulk
          </Button>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-12 pl-6">
                  <Checkbox 
                    checked={filtered?.length ? selectedIds.length === filtered.length : false}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest text-[#081621]">Invoice #</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Client</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Net Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Settlement</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Created</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest text-[#081621]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((inv) => (
                <TableRow key={inv.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(inv.id) && "bg-primary/5")}>
                  <TableCell className="pl-6">
                    <Checkbox 
                      checked={selectedIds.includes(inv.id)}
                      onCheckedChange={() => toggleSelect(inv.id)}
                    />
                  </TableCell>
                  <TableCell className="py-5 pl-4 font-black text-xs text-primary">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-900 uppercase leading-none">{inv.customerInfo?.name}</div>
                    <div className="text-[9px] text-muted-foreground font-medium mt-1">{inv.customerInfo?.phone}</div>
                  </TableCell>
                  <TableCell className="font-black text-sm text-gray-900">৳{inv.total?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-2 py-0.5 rounded-md shadow-sm",
                      inv.paymentStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {inv.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-400">
                    {inv.createdAt ? format(new Date(inv.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" asChild>
                        <Link href={`/admin/invoices/${inv.id}`}><Eye size={16} /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50 rounded-xl" onClick={() => deleteDoc(doc(db!, 'invoices', inv.id))}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 🛠️ MANUAL INVOICE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-full md:h-auto md:max-h-[90vh] p-0 border-none rounded-none md:rounded-[2.5rem] shadow-2xl bg-white flex flex-col overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <header className="p-6 md:p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-xl shadow-lg"><ReceiptText size={20} /></div>
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">Manual Invoice Generation</DialogTitle>
                </div>
                <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Create an authenticated billing document from scratch</DialogDescription>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><User size={14}/> Client Identification</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                        <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="e.g. Acme Corp" className="h-11 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                        <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-11 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Address</Label>
                      <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="House, Road, Area, Dhaka" className="min-h-[80px] bg-gray-50 border-none rounded-2xl p-4 shadow-inner" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"><ReceiptText size={14}/> Billing Items</h4>
                      <Button onClick={addManualItem} variant="outline" size="sm" className="rounded-xl h-8 text-[9px] font-black uppercase border-primary/20 text-primary">+ Add Item</Button>
                    </div>
                    <div className="space-y-3">
                      {manualItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group animate-in slide-in-from-right-2">
                          <div className="space-y-1 w-full">
                            <Label className="text-[8px] font-black uppercase text-gray-400">Description</Label>
                            <Input value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value)} placeholder="Service or product name" className="h-9 bg-white border-none rounded-lg text-xs font-bold" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-gray-400">Unit Type</Label>
                              <Select value={item.unit} onValueChange={v => updateManualItem(idx, 'unit', v)}>
                                <SelectTrigger className="h-9 bg-white border-none rounded-lg text-[9px] font-black uppercase shadow-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  <SelectItem value="Qty" className="text-[10px] font-black uppercase">Quantity (Qty)</SelectItem>
                                  <SelectItem value="Sqft" className="text-[10px] font-black uppercase">Square Feet (Sqft)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-gray-400">Rate (৳)</Label>
                              <Input type="number" value={item.price} onChange={e => updateManualItem(idx, 'price', e.target.value)} placeholder="৳" className="h-9 bg-white border-none rounded-lg text-xs font-black text-primary shadow-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-gray-400">{item.unit === 'Sqft' ? 'Area' : 'Qty'}</Label>
                              <Input type="number" value={item.quantity} onChange={e => updateManualItem(idx, 'quantity', e.target.value)} className="h-9 bg-white border-none rounded-lg text-xs font-black shadow-sm" />
                            </div>
                            <div className="flex justify-end">
                              <Button variant="ghost" size="icon" onClick={() => removeManualItem(idx)} className="h-9 w-9 text-red-400 hover:bg-red-50 rounded-lg">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-gray-50/50 p-6 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col gap-8 h-fit sticky top-0">
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Calculator size={16} /> Final Calculations</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Delivery/Extra Fee</Label>
                            <Input type="number" value={pricing.delivery} onChange={e => setPricing({...pricing, delivery: parseFloat(e.target.value) || 0})} className="h-11 bg-white border-none rounded-xl font-black text-xs shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Discount Amount</Label>
                            <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-11 bg-white border-none rounded-xl font-black text-xs text-rose-600 shadow-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Payment Method</Label>
                            <Select value={pricing.paymentMethod} onValueChange={v => setPricing({...pricing, paymentMethod: v})}>
                              <SelectTrigger className="h-11 bg-white border-none rounded-xl font-black text-[9px] uppercase"><SelectValue/></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {['Cash', 'bKash', 'Nagad', 'Bank Transfer'].map(m => <SelectItem key={m} value={m} className="font-black text-[9px] uppercase">{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Payment Status</Label>
                            <Select value={pricing.paymentStatus} onValueChange={v => setPricing({...pricing, paymentStatus: v})}>
                              <SelectTrigger className="h-11 bg-white border-none rounded-xl font-black text-[9px] uppercase"><SelectValue/></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {['Paid', 'Unpaid'].map(s => <SelectItem key={s} value={s} className="font-black text-[9px] uppercase">{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Total Payable Amount</span>
                          <span className="text-4xl font-black text-primary tracking-tighter">৳{totalAmount.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 py-1 rounded-md">BDT</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-[9px] font-bold text-blue-900 leading-tight uppercase">
                        Manual invoices carry the same legal authenticity as system-generated ones. All records are archived in the primary ledger.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
              <Button onClick={handleCreateManualInvoice} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Authorize & Generate</>}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvoicesListPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <InvoicesListContent />
    </Suspense>
  );
}
