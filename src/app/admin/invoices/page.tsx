'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, writeBatch, addDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  Calculator,
  User,
  Save,
  Edit,
  Info,
  TrendingUp,
  CreditCard
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
import { getOrCreateInvoice } from '@/lib/invoice-utils';

function InvoicesListContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Manual Invoice / Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualItems, setManualItems] = useState<any[]>([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [pricing, setPricing] = useState({ discount: 0, delivery: 0, paymentStatus: 'Unpaid', paymentMethod: 'Cash' });

  const invoicesQuery = useMemoFirebase(() => db ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  // Dynamic KPI Engine
  const stats = useMemo(() => {
    if (!invoices) return { total: 0, paidCount: 0, unpaidCount: 0, revenue: 0, due: 0 };
    return {
      total: invoices.length,
      paidCount: invoices.filter(i => i.paymentStatus === 'Paid').length,
      unpaidCount: invoices.filter(i => i.paymentStatus !== 'Paid').length,
      revenue: invoices.filter(i => i.paymentStatus === 'Paid').reduce((acc, i) => acc + (i.total || 0), 0),
      due: invoices.filter(i => i.paymentStatus !== 'Paid').reduce((acc, i) => acc + (i.total || 0), 0)
    };
  }, [invoices]);

  const filtered = invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerInfo?.phone?.includes(searchTerm)
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

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} invoices?`)) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'invoices', id)));
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Bulk Removal Successful" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Form Handlers
  const addManualItem = () => setManualItems([...manualItems, { name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const removeManualItem = (idx: number) => setManualItems(manualItems.filter((_, i) => i !== idx));
  const updateManualItem = (idx: number, field: string, val: any) => {
    const next = [...manualItems];
    next[idx][field] = val;
    setManualItems(next);
  };

  const handleOpenEdit = (inv: any) => {
    setEditingInvoiceId(inv.id);
    setCustomer({
      name: inv.customerInfo?.name || '',
      phone: inv.customerInfo?.phone || '',
      address: inv.customerInfo?.address || ''
    });
    setManualItems(inv.items?.map((i: any) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      unit: i.unit || 'Qty',
      type: i.type || 'service'
    })) || []);
    setPricing({
      discount: inv.discount || 0,
      delivery: inv.deliveryCharge || 0,
      paymentStatus: inv.paymentStatus || 'Unpaid',
      paymentMethod: inv.paymentMethod || 'Cash'
    });
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingInvoiceId(null);
    setCustomer({ name: '', phone: '', address: '' });
    setManualItems([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
    setPricing({ discount: 0, delivery: 0, paymentStatus: 'Unpaid', paymentMethod: 'Cash' });
    setIsFormOpen(true);
  };

  const subtotal = useMemo(() => {
    return manualItems.reduce((acc, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseFloat(item.quantity) || 1;
      return acc + (p * q);
    }, 0);
  }, [manualItems]);

  const totalAmount = Number((subtotal + pricing.delivery - pricing.discount).toFixed(2));

  const handleSaveInvoice = async () => {
    if (!db) return;
    if (!customer.name || !customer.phone) {
      toast({ variant: "destructive", title: "Information Required", description: "Customer name and phone are mandatory." });
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceData = {
        customerInfo: { ...customer },
        items: manualItems.map(i => ({ 
          name: i.name, 
          price: parseFloat(i.price) || 0, 
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit,
          type: i.type 
        })),
        subtotal,
        tax: 0,
        discount: Number(pricing.discount),
        deliveryCharge: Number(pricing.delivery),
        total: totalAmount,
        paymentStatus: pricing.paymentStatus,
        paymentMethod: pricing.paymentMethod,
        updatedAt: new Date().toISOString(),
        paidAmount: pricing.paymentStatus === 'Paid' ? totalAmount : 0,
        dueAmount: pricing.paymentStatus === 'Paid' ? 0 : totalAmount
      };

      if (editingInvoiceId) {
        await updateDoc(doc(db, 'invoices', editingInvoiceId), invoiceData);
        toast({ title: "Invoice Updated" });
      } else {
        const countSnap = await getDocs(collection(db, 'invoices'));
        const invoiceNumber = `INV-MAN-${(countSnap.size + 1).toString().padStart(4, '0')}`;
        const newInvoice = { ...invoiceData, invoiceNumber, createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        const publicLink = `${window.location.origin}/invoice/view/${docRef.id}`;
        await updateDoc(doc(db, 'invoices', docRef.id), { publicLink });
        toast({ title: "Invoice Created" });
      }
      setIsFormOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Billing Registry</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Audit-ready documentation for all sales and services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 border-gray-200 gap-2"><Download size={16} /> Export Audit</Button>
          <Button onClick={handleOpenCreate} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest bg-primary text-white">
            <Plus size={18} /> New Manual Invoice
          </Button>
        </div>
      </div>

      {/* 📊 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Volume", val: stats.total, icon: FileText, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Net Revenue", val: `৳${stats.revenue.toLocaleString()}`, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Total Due", val: `৳${stats.due.toLocaleString()}`, icon: AlertCircle, bg: "bg-rose-50", color: "text-rose-600" },
          { label: "Settled", val: stats.paidCount, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Outstanding", val: stats.unpaidCount, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-lg font-black text-gray-900 truncate">{s.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search Invoice #, Customer or Phone..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#081621] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <span className="text-[10px] font-black uppercase px-2">{selectedIds.length} INVOICES SELECTED</span>
          <Button variant="ghost" onClick={handleBulkDelete} disabled={isBulkProcessing} className="text-rose-400 hover:text-white hover:bg-rose-600 font-black uppercase text-[10px] gap-2">
            <Trash2 size={14} /> Delete permanently
          </Button>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none">
                <TableHead className="w-12 pl-6">
                  <Checkbox 
                    checked={filtered?.length ? selectedIds.length === filtered.length : false}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest text-[#081621]">Ref Number</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Client Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Net Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621] text-center">Settlement</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest text-[#081621]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.length ? (
                filtered.map((inv) => (
                  <TableRow key={inv.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(inv.id) && "bg-primary/5")}>
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.includes(inv.id)}
                        onCheckedChange={() => toggleSelect(inv.id)}
                      />
                    </TableCell>
                    <TableCell className="py-5 pl-4 font-black text-xs text-primary">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-900 uppercase leading-none mb-1">{inv.customerInfo?.name}</div>
                      <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">{inv.customerInfo?.phone}</div>
                    </TableCell>
                    <TableCell className="font-black text-sm text-gray-900">৳{inv.total?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn(
                        "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg",
                        inv.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700 shadow-sm" : "bg-rose-50 text-rose-700 shadow-sm"
                      )}>
                        {inv.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" asChild title="Preview Document">
                          <Link href={`/admin/invoices/${inv.id}`}><Eye size={18} /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 rounded-xl" onClick={() => handleOpenEdit(inv)} title="Update Data">
                          <Edit size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => deleteDoc(doc(db!, 'invoices', inv.id))} title="Purge Record">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No active billing records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-full md:h-auto md:max-h-[90vh] p-0 border-none rounded-none md:rounded-[2.5rem] shadow-2xl bg-white flex flex-col overflow-hidden">
          <header className="p-6 md:p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl shadow-lg"><ReceiptText size={20} /></div>
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight">
                  {editingInvoiceId ? 'Update Billing Document' : 'Authorize Manual Invoice'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Enrollment of direct service or product sales</DialogDescription>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><User size={14}/> Client Verification</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                      <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="Customer Label" className="h-11 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                      <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-11 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work/Delivery Address</Label>
                    <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="Site location details..." className="min-h-[80px] bg-gray-50 border-none rounded-2xl p-4 shadow-inner" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2"><Plus size={14}/> Scope of Items</h4>
                    <Button onClick={addManualItem} variant="outline" size="sm" className="rounded-xl h-8 text-[9px] font-black uppercase border-indigo-200 text-indigo-600">+ Add Item</Button>
                  </div>
                  <div className="space-y-3">
                    {manualItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group animate-in slide-in-from-right-2">
                        <div className="space-y-1 w-full">
                          <Label className="text-[8px] font-black uppercase text-gray-400">Description</Label>
                          <Input value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value)} placeholder="e.g. Sofa Cleaning (4 Seat)" className="h-9 bg-white border-none rounded-lg text-xs font-bold" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-gray-400">Unit Type</Label>
                            <Select value={item.unit} onValueChange={v => updateManualItem(idx, 'unit', v)}>
                              <SelectTrigger className="h-9 bg-white border-none rounded-lg text-[9px] font-black uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-lg">
                                {['Qty', 'Sqft', 'Pcs', 'Kg', 'Feet'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-gray-400">Rate (৳)</Label>
                            <Input type="number" value={item.price} onChange={e => updateManualItem(idx, 'price', e.target.value)} placeholder="৳" className="h-9 bg-white border-none rounded-lg text-xs font-black text-primary" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-gray-400">{item.unit === 'Sqft' ? 'Area' : 'Qty'}</Label>
                            <Input type="number" value={item.quantity} onChange={e => updateManualItem(idx, 'quantity', e.target.value)} className="h-9 bg-white border-none rounded-lg text-xs font-black" />
                          </div>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" onClick={() => removeManualItem(idx)} className="h-9 w-9 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></Button>
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
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><Calculator size={16} /> Calculations</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400">Delivery/Extra (৳)</Label>
                          <Input type="number" value={pricing.delivery} onChange={e => setPricing({...pricing, delivery: parseFloat(e.target.value) || 0})} className="h-11 bg-white border-none rounded-xl font-black text-xs" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400">Discount (৳)</Label>
                          <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-11 bg-white border-none rounded-xl font-black text-xs text-rose-600" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400">Protocol</Label>
                          <Select value={pricing.paymentMethod} onValueChange={v => setPricing({...pricing, paymentMethod: v})}>
                            <SelectTrigger className="h-11 bg-white border-none rounded-xl font-black text-[9px] uppercase"><SelectValue/></SelectTrigger>
                            <SelectContent>
                              {['Cash', 'bKash', 'Nagad', 'Bank'].map(m => <SelectItem key={m} value={m} className="font-black text-[9px] uppercase">{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400">Settlement</Label>
                          <Select value={pricing.paymentStatus} onValueChange={v => setPricing({...pricing, paymentStatus: v})}>
                            <SelectTrigger className="h-11 bg-white border-none rounded-xl font-black text-[9px] uppercase"><SelectValue/></SelectTrigger>
                            <SelectContent>
                              {['Paid', 'Unpaid'].map(s => <SelectItem key={s} value={s} className="font-black text-[9px] uppercase">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-1 uppercase">Grand Total Payable</span>
                        <span className="text-4xl font-black text-primary tracking-tighter">৳{totalAmount.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] px-3 py-1.5 rounded-lg shadow-inner">0% VAT</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-[9px] font-bold text-blue-900 leading-tight uppercase">
                      Changes published here will update the live public invoice link and PDF metadata instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
            <Button onClick={handleSaveInvoice} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> {editingInvoiceId ? 'Sync Updates' : 'Authorize & Generate'}</>}
            </Button>
          </DialogFooter>
        </div>
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
