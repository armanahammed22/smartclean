'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, writeBatch, addDoc, getDocs, updateDoc, where, setDoc, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Search, 
  Trash2, 
  Eye, 
  Edit, 
  Loader2, 
  Filter, 
  ReceiptText, 
  Zap,
  Plus,
  X,
  Calculator,
  Save,
  Info,
  Phone,
  Package,
  Wrench,
  Banknote,
  ShieldCheck,
  Clock,
  History,
  Wallet,
  Users,
  AlertCircle,
  FileDown,
  ArrowRight
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
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import Image from 'next/image';

function InvoicesListContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Manual Invoice / Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [manualItems, setManualItems] = useState<any[]>([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '', previousDue: 0, totalPaid: 0, totalInvoiced: 0 });
  const [pricing, setPricing] = useState({ discount: 0, delivery: 0, vatPercent: 0, paidAmount: 0, paymentStatus: 'Unpaid', paymentMethod: 'Cash' });
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedUnpaidIds, setSelectedUnpaidIds] = useState<string[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState(1);

  // Queries
  const invoicesQuery = useMemoFirebase(() => db ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc')) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);

  const { data: invoices, isLoading } = useCollection(invoicesQuery);
  const { data: customersRaw } = useCollection(customersQuery);
  const { data: serviceCatalogRaw } = useCollection(servicesQuery);

  const customersList = useMemo(() => {
    if (!customersRaw) return [];
    return [...customersRaw].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [customersRaw]);

  const serviceCatalog = useMemo(() => {
    if (!serviceCatalogRaw) return [];
    return [...serviceCatalogRaw].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [serviceCatalogRaw]);

  const stats = useMemo(() => {
    if (!invoices) return { total: 0, paidCount: 0, unpaidCount: 0, revenue: 0, due: 0 };
    setInvoiceCounter(invoices.length + 1);
    return {
      total: invoices.length,
      paidCount: invoices.filter(i => i.paymentStatus === 'Paid').length,
      unpaidCount: invoices.filter(i => i.paymentStatus !== 'Paid').length,
      revenue: invoices.filter(i => i.paymentStatus === 'Paid').reduce((acc, i) => acc + (i.total || 0), 0),
      due: invoices.reduce((acc, i) => acc + (i.dueAmount || 0), 0)
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

  const handleDeleteSingle = async (id: string) => {
    if (!db || !confirm("Permanently delete this invoice?")) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'invoices', id));
      toast({ title: "Invoice Deleted" });
      setSelectedIds(prev => prev.filter(item => item !== id));
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addManualItem = () => setManualItems([...manualItems, { name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
  const removeManualItem = (idx: number) => setManualItems(manualItems.filter((_, i) => i !== idx));
  const updateManualItem = (idx: number, field: string, val: any) => {
    const next = [...manualItems];
    next[idx][field] = val;
    setManualItems(next);
  };

  const addServiceFromCatalog = (serviceId: string) => {
    const service = serviceCatalog?.find(s => s.id === serviceId);
    if (!service) return;
    setManualItems([...manualItems, { 
      name: service.title, 
      price: service.basePrice || 0, 
      quantity: 1, 
      type: 'service', 
      unit: 'Qty' 
    }]);
  };

  const handleCustomerSelect = async (userId: string) => {
    const selected = customersList?.find(u => u.id === userId);
    if (selected) {
      setCustomer({
        id: selected.id,
        name: selected.name || '',
        phone: selected.phone || '',
        address: selected.address || '',
        previousDue: selected.outstandingBalance || 0,
        totalPaid: selected.totalPaid || 0,
        totalInvoiced: selected.totalInvoiced || 0
      });

      if (db) {
        try {
          const q = query(collection(db, 'invoices'), where('customerId', '==', userId));
          const snap = await getDocs(q);
          const docs = snap.docs
            .map(d => ({ ...d.data(), id: d.id }))
            .filter((inv: any) => inv.paymentStatus !== 'Paid')
            .sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt));
          
          setUnpaidInvoices(docs);
          setSelectedUnpaidIds(docs.map(d => d.id));
        } catch (e) {
          console.warn('[Invoice Logic] Failed to fetch previous arrears:', e);
        }
      }
    }
  };

  const handleOpenEdit = (inv: any) => {
    setEditingInvoiceId(inv.id);
    setCustomer({
      id: inv.customerId || '',
      name: inv.customerInfo?.name || '',
      phone: inv.customerInfo?.phone || '',
      address: inv.customerInfo?.address || '',
      previousDue: inv.previousDue || 0,
      totalPaid: 0,
      totalInvoiced: 0
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
      vatPercent: inv.vatPercent || 0,
      paidAmount: inv.paidAmount || 0,
      paymentStatus: inv.paymentStatus || 'Unpaid',
      paymentMethod: inv.paymentMethod || 'Cash'
    });
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingInvoiceId(null);
    setCustomer({ id: '', name: '', phone: '', address: '', previousDue: 0, totalPaid: 0, totalInvoiced: 0 });
    setManualItems([{ name: '', price: '', quantity: 1, type: 'service', unit: 'Qty' }]);
    setPricing({ discount: 0, delivery: 0, vatPercent: 0, paidAmount: 0, paymentStatus: 'Unpaid', paymentMethod: 'Cash' });
    setUnpaidInvoices([]);
    setSelectedUnpaidIds([]);
    setIsFormOpen(true);
  };

  const currentSubtotal = useMemo(() => {
    return manualItems.reduce((acc, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseFloat(item.quantity) || 1;
      return acc + (p * q);
    }, 0);
  }, [manualItems]);

  const selectedPreviousDue = useMemo(() => {
    return unpaidInvoices
      .filter(inv => selectedUnpaidIds.includes(inv.id))
      .reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  }, [unpaidInvoices, selectedUnpaidIds]);

  const vatAmount = Number(((currentSubtotal - pricing.discount) * (pricing.vatPercent / 100)).toFixed(2));
  const currentInvoiceTotal = Number((currentSubtotal + pricing.delivery + vatAmount - pricing.discount).toFixed(2));
  const grandTotal = Number((currentInvoiceTotal + selectedPreviousDue).toFixed(2));
  const currentDue = Number((grandTotal - pricing.paidAmount).toFixed(2));

  const handleSaveInvoice = async () => {
    if (!db) return;
    if (!customer.name || !customer.phone) {
      toast({ variant: "destructive", title: "Information Required", description: "Customer name and phone are mandatory." });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = customer.id;

      if (!finalCustomerId) {
        const q = query(collection(db, 'users'), where('phone', '==', customer.phone), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          finalCustomerId = snap.docs[0].id;
        } else {
          const newCustomerRef = doc(collection(db, 'users'));
          await setDoc(newCustomerRef, {
            uid: newCustomerRef.id,
            name: customer.name,
            phone: customer.phone,
            email: '',
            address: customer.address,
            role: 'customer',
            status: 'active',
            totalInvoiced: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          finalCustomerId = newCustomerRef.id;
        }
      }

      const invoiceData = {
        customerId: finalCustomerId,
        customerInfo: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address
        },
        items: manualItems.map(i => ({ 
          name: i.name, 
          price: parseFloat(i.price) || 0, 
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit,
          type: i.type 
        })),
        currentAmount: currentInvoiceTotal,
        subtotal: currentSubtotal,
        vatPercent: Number(pricing.vatPercent),
        tax: vatAmount,
        discount: Number(pricing.discount),
        deliveryCharge: Number(pricing.delivery),
        previousDue: selectedPreviousDue,
        previousDueIds: selectedUnpaidIds,
        total: grandTotal,
        paidAmount: Number(pricing.paidAmount),
        dueAmount: currentDue,
        paymentStatus: currentDue <= 0 ? 'Paid' : pricing.paidAmount > 0 ? 'Partial' : 'Unpaid',
        paymentMethod: pricing.paymentMethod,
        paymentHistory: editingInvoiceId ? [] : (pricing.paidAmount > 0 ? [{
          id: 'pay_init_' + Date.now(),
          amount: pricing.paidAmount,
          date: new Date().toISOString(),
          method: pricing.paymentMethod,
          notes: 'Initial Payment'
        }] : []),
        updatedAt: new Date().toISOString()
      };

      if (editingInvoiceId) {
        await updateDoc(doc(db, 'invoices', editingInvoiceId), invoiceData);
        toast({ title: "Invoice Updated" });
      } else {
        const invoiceNumber = `INV-${invoiceCounter.toString().padStart(4, '0')}`;
        const newInvoice = { ...invoiceData, invoiceNumber, createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartclean.com.bd';
        const publicLink = `${baseUrl}/invoice/${invoiceNumber}`;
        await updateDoc(doc(db, 'invoices', docRef.id), { publicLink });
        toast({ title: "Invoice Generated" });
      }
      setIsFormOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      {/* 🔝 PREMIUM HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Billing Registry</h1>
          <p className="text-muted-foreground text-sm font-medium">Enterprise financial documentation & history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreate} className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10 gap-2">
            <Plus size={16} strokeWidth={3} /> New Invoice
          </Button>
        </div>
      </div>

      {/* 📊 MINI STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "Gross Volume", val: `৳${stats.revenue.toLocaleString()}`, icon: Banknote, bg: "bg-emerald-500/10", color: "text-emerald-500" },
          { label: "Receivables", val: `৳${stats.due.toLocaleString()}`, icon: Wallet, bg: "bg-rose-500/10", color: "text-rose-500" },
          { label: "Settled", val: stats.paidCount, icon: ShieldCheck, bg: "bg-blue-500/10", color: "text-blue-500" },
          { label: "Total Invoices", val: stats.total, icon: Zap, bg: "bg-amber-500/10", color: "text-amber-500" },
          { label: "Outstanding", val: stats.unpaidCount, icon: Clock, bg: "bg-indigo-500/10", color: "text-indigo-500" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className={cn("p-2 rounded-xl w-fit shadow-sm", s.bg, s.color)}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-lg font-black text-[#081621] truncate">{s.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <Input 
              placeholder="Search by ID, name or phone..." 
              className="pl-12 h-11 border-none bg-gray-50 focus:bg-white rounded-xl transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="h-11 rounded-xl px-5 gap-2 font-black uppercase text-[9px] border-gray-200">
                <Filter size={16}/> Filter
             </Button>
             {selectedIds.length > 0 && (
              <Button variant="destructive" className="h-11 rounded-xl px-6 font-black uppercase text-[9px]" onClick={handleBulkDelete} disabled={isBulkProcessing}>
                Delete ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[1.5rem] border border-gray-100">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <div className="min-w-full">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="w-12 pl-6">
                      <Checkbox checked={filtered?.length ? selectedIds.length === filtered.length : false} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="font-black py-4 pl-2 uppercase text-[9px] tracking-widest text-[#081621]">Ref ID</TableHead>
                    <TableHead className="font-black uppercase text-[9px] tracking-widest text-[#081621]">Customer</TableHead>
                    <TableHead className="font-black uppercase text-[9px] tracking-widest text-[#081621]">Total Bill</TableHead>
                    <TableHead className="font-black uppercase text-[9px] tracking-widest text-center text-[#081621]">Status</TableHead>
                    <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest text-[#081621]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                  ) : filtered?.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="pl-6"><Checkbox checked={selectedIds.includes(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} /></TableCell>
                      <TableCell className="py-4 pl-2 font-black text-xs text-primary font-mono">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 uppercase">{inv.customerInfo?.name}</span>
                          <span className="text-[9px] text-muted-foreground">{inv.customerInfo?.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-xs">৳{inv.total?.toLocaleString()}</span>
                          {inv.dueAmount > 0 && <span className="text-[8px] font-black text-rose-500 uppercase">Due: ৳{inv.dueAmount}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "text-[7px] font-black uppercase border-none px-2 py-0.5 rounded-md",
                          inv.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                        )}>{inv.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild><Link href={`/invoice/${inv.invoiceNumber}`}><Eye size={16} /></Link></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => handleOpenEdit(inv)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSingle(inv.id)} disabled={isSubmitting}><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🖥️ MINIMALIST SAAS MODAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[1300px] w-[95vw] h-full md:h-auto md:max-h-[90vh] p-0 border-none rounded-[1.5rem] shadow-2xl bg-[#FBFBFB] flex flex-col overflow-hidden">
          <header className="h-[80px] bg-white border-b flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><ReceiptText size={22} /></div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">Invoice Terminal</DialogTitle>
                <DialogDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {editingInvoiceId ? 'UPDATING RECORD' : `CREATING ${invoiceCounter.toString().padStart(4, '0')}`}
                </DialogDescription>
              </div>
            </div>
            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"><X size={24}/></button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: FORM (70%) */}
              <div className="lg:col-span-8 space-y-10 pb-20">
                
                {/* 👤 CUSTOMER SECTION */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <Users size={16} className="text-primary" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">Client Identity</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Search Existing</Label>
                      <Select onValueChange={handleCustomerSelect}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner">
                          <SelectValue placeholder="Select a customer..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {customersList?.map(u => (
                            <SelectItem key={u.id} value={u.id} className="py-3 font-bold text-xs uppercase">{u.name} — {u.phone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Full Name</Label>
                      <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Mobile Phone</Label>
                      <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Site/Billing Address</Label>
                      <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    </div>
                  </div>
                </section>

                {/* 📑 PREVIOUS DUE SECTION */}
                {unpaidInvoices.length > 0 && (
                  <section className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <History size={16} className="text-rose-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">Carry Forward Arrears</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {unpaidInvoices.map((inv) => (
                        <div 
                          key={inv.id} 
                          onClick={() => {
                            const next = selectedUnpaidIds.includes(inv.id) ? selectedUnpaidIds.filter(id => id !== inv.id) : [...selectedUnpaidIds, inv.id];
                            setSelectedUnpaidIds(next);
                          }}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                            selectedUnpaidIds.includes(inv.id) ? "bg-rose-50 border-rose-500 shadow-sm" : "bg-white border-gray-100 hover:border-rose-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", selectedUnpaidIds.includes(inv.id) ? "bg-rose-600" : "bg-gray-200")} />
                            <div>
                              <p className="text-[11px] font-black text-gray-900 leading-none">{inv.invoiceNumber}</p>
                              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{format(new Date(inv.createdAt), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-rose-600">৳{inv.dueAmount}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 🛠️ SERVICE ITEMS */}
                <section className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <Wrench size={16} className="text-indigo-600" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">Service Ledger</h4>
                    </div>
                    <div className="flex gap-2">
                      <Select onValueChange={addServiceFromCatalog}>
                        <SelectTrigger className="h-9 w-48 bg-white border-gray-200 rounded-xl font-black uppercase text-[9px] shadow-sm"><SelectValue placeholder="Quick Catalog Add" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {serviceCatalog?.map(s => <SelectItem key={s.id} value={s.id} className="py-2.5 font-bold text-[10px] uppercase">{s.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button type="button" onClick={addManualItem} className="h-9 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase text-[9px] hover:bg-gray-50 transition-all">+ Add Item</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {manualItems.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-end group">
                        <div className="md:col-span-5 space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-gray-400">Description</Label>
                          <Input value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-gray-400">Unit</Label>
                          <Select value={item.unit} onValueChange={v => updateManualItem(idx, 'unit', v)}>
                            <SelectTrigger className="h-10 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase"><SelectValue/></SelectTrigger>
                            <SelectContent className="rounded-xl">{['Qty', 'Sqft', 'Pcs', 'Unit'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-gray-400">Rate</Label>
                          <Input type="number" value={item.price} onChange={e => updateManualItem(idx, 'price', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl font-black text-xs text-primary" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-gray-400">Qty</Label>
                          <Input type="number" value={item.quantity} onChange={e => updateManualItem(idx, 'quantity', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl font-black text-xs" />
                        </div>
                        <div className="md:col-span-1 flex justify-center pb-1">
                          <button onClick={() => removeManualItem(idx)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Transaction Notes</Label>
                  <Textarea value={pricing.notes} onChange={e => setPricing({...pricing, notes: (e.target as any).value})} className="h-24 bg-white border border-gray-100 rounded-2xl p-4 font-medium text-sm" placeholder="Terms, warranty or payment notes..." />
                </div>
              </div>

              {/* RIGHT: STICKY SUMMARY (30%) */}
              <div className="lg:col-span-4 lg:sticky lg:top-0 space-y-6">
                <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2rem] overflow-hidden">
                  <CardHeader className="p-8 border-b border-white/5 bg-black/10">
                    <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2"><Calculator size={18} className="text-primary"/> Billing Control</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold text-white/40 uppercase"><span>Current Services</span><span>৳{currentSubtotal.toLocaleString()}</span></div>
                      {selectedPreviousDue > 0 && <div className="flex justify-between text-xs font-bold text-rose-400 uppercase"><span>Previous Arrears</span><span>৳{selectedPreviousDue.toLocaleString()}</span></div>}
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[9px] font-black uppercase text-white/40">Manual Discount</Label>
                        <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black text-rose-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[9px] font-black uppercase text-white/40">Logistics Fee</Label>
                        <Input type="number" value={pricing.delivery} onChange={e => setPricing({...pricing, delivery: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black text-primary" />
                      </div>
                      
                      <div className="pt-6 border-t border-white/10 space-y-1">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Grand Total Balance</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black tracking-tighter text-primary italic">৳{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/10 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-emerald-400">Payment Received (৳)</Label>
                          <Input type="number" value={pricing.paidAmount} onChange={e => setPricing({...pricing, paidAmount: parseFloat(e.target.value) || 0})} className="h-12 bg-emerald-500/10 border-emerald-500/20 rounded-xl font-black text-lg text-emerald-400 shadow-inner" />
                        </div>
                        <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                           <div className="space-y-0.5">
                             <p className="text-[8px] font-black text-white/40 uppercase">Closing Balance</p>
                             <p className={cn("text-xl font-black", currentDue > 0 ? "text-rose-400" : "text-emerald-400")}>{currentDue > 0 ? `৳${currentDue.toLocaleString()}` : 'FULL SETTLED'}</p>
                           </div>
                           {currentDue <= 0 ? <ShieldCheck size={28} className="text-emerald-400" /> : <AlertCircle size={28} className="text-rose-400 animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                   <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Info size={14}/> Audit Note</h5>
                   <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                     Payments are applied using FIFO (First-In, First-Out) logic. Older arrears will be settled before the current invoice balance.
                   </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="h-[90px] bg-white border-t px-8 shrink-0 flex items-center justify-between z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest">Discard</Button>
            <div className="flex gap-3">
               <Button variant="outline" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200">Save Draft</Button>
               <Button onClick={handleSaveInvoice} disabled={isSubmitting} className="h-12 px-10 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px]">
                 {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize & Launch Invoice"}
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvoicesListPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <InvoicesListContent />
    </Suspense>
  );
}
