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
  Loader2, 
  Filter, 
  ReceiptText, 
  Zap,
  Plus,
  X,
  Calculator,
  Save,
  Edit,
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
  AlertCircle
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

  // CALCULATION ENGINE V2
  const vatAmount = Number(((currentSubtotal - pricing.discount) * (pricing.vatPercent / 100)).toFixed(2));
  const currentInvoiceTotal = Number((currentSubtotal + pricing.delivery + vatAmount - pricing.discount).toFixed(2));
  
  // NEW: Summing correctly
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

      // 1. Auto-create or Update Customer Profile
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

      // 2. Prepare Invoice Data
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
        currentAmount: currentInvoiceTotal, // Explicitly naming current service amount
        subtotal: currentSubtotal,
        vatPercent: Number(pricing.vatPercent),
        tax: vatAmount,
        discount: Number(pricing.discount),
        deliveryCharge: Number(pricing.delivery),
        previousDue: selectedPreviousDue,
        previousDueIds: selectedUnpaidIds,
        total: grandTotal, // subtotal + prevDue
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
        const countSnap = await getDocs(collection(db, 'invoices'));
        const invoiceNumber = `INV-${(countSnap.size + 1).toString().padStart(4, '0')}`;
        const newInvoice = { ...invoiceData, invoiceNumber, createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        
        const publicLink = `${window.location.origin}/invoice/view/${docRef.id}`;
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
    <div className="space-y-10 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#081621] p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150 transition-transform group-hover:scale-125 duration-1000"><ReceiptText size={240} /></div>
        <div className="relative z-10 space-y-2">
          <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg">Billing Hub v2.5</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none font-headline italic">
            Invoice <span className="text-primary">Registry</span>
          </h1>
          <p className="text-white/40 text-xs md:text-sm font-medium tracking-wide">Enterprise-grade financial documentation & ledger</p>
        </div>
        <div className="relative z-10">
          <button onClick={handleOpenCreate} className="h-14 md:h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 gap-3 border-none flex items-center justify-center">
            <Plus size={20} strokeWidth={3} /> Authorize New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "Gross Volume", val: `৳${stats.revenue.toLocaleString()}`, icon: Banknote, bg: "bg-emerald-500/10", color: "text-emerald-500" },
          { label: "Receivables", val: `৳${stats.due.toLocaleString()}`, icon: Wallet, bg: "bg-rose-500/10", color: "text-rose-500" },
          { label: "Settled Bills", val: stats.paidCount, icon: ShieldCheck, bg: "bg-blue-500/10", color: "text-blue-500" },
          { label: "Active Subs", val: stats.total, icon: Zap, bg: "bg-amber-500/10", color: "text-amber-500" },
          { label: "Outstanding", val: stats.unpaidCount, icon: Clock, bg: "bg-indigo-500/10", color: "text-indigo-500" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group transition-all hover:shadow-2xl">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className={cn("p-3 rounded-2xl w-fit transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm", s.bg, s.color)}>
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{s.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-[#081621] truncate tracking-tight">{s.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] shadow-xl border border-gray-100">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Filter by ref number, customer, or phone..." 
              className="pl-14 h-14 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium text-sm shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <Button variant="outline" className="h-14 rounded-2xl px-6 gap-2 font-black uppercase text-[10px] border-gray-200">
                <Filter size={18}/> Advanced
             </Button>
             {selectedIds.length > 0 && (
              <Button variant="destructive" className="h-14 rounded-2xl px-8 font-black uppercase text-[10px] shadow-lg animate-in zoom-in-95" onClick={handleBulkDelete} disabled={isBulkProcessing}>
                Purge ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <div className="min-w-full">
              <Table>
                <TableHeader className="bg-gray-50/50 border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 pl-8">
                      <Checkbox 
                        checked={filtered?.length ? selectedIds.length === filtered.length : false}
                        onCheckedChange={toggleSelectAll}
                        className="rounded-lg h-5 w-5 border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="font-black py-6 pl-2 uppercase text-[10px] tracking-widest text-[#081621]">Ref. ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Customer Profile</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Bill Summary</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-[#081621]">Protocol</TableHead>
                    <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest text-[#081621]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-32"><Loader2 className="animate-spin text-primary inline" size={40} /></TableCell></TableRow>
                  ) : filtered?.length ? (
                    filtered.map((inv) => (
                      <TableRow key={inv.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(inv.id) && "bg-primary/5")}>
                        <TableCell className="pl-8">
                          <Checkbox 
                            checked={selectedIds.includes(inv.id)}
                            onCheckedChange={() => toggleSelect(inv.id)}
                            className="rounded-lg h-5 w-5 border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="py-6 pl-2 font-black text-xs text-primary font-mono">{inv.invoiceNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                              {inv.customerInfo?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900 uppercase leading-none mb-1.5">{inv.customerInfo?.name}</div>
                              <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tight flex items-center gap-1.5">
                                <Phone size={10} className="text-primary"/> {inv.customerInfo?.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-black text-sm text-gray-900 tracking-tighter">৳{inv.total?.toLocaleString()}</span>
                            <div className="text-[8px] font-bold text-rose-500 uppercase">Due: ৳{inv.dueAmount?.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn(
                            "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm",
                            inv.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700" : 
                            inv.paymentStatus === 'Partial' ? "bg-blue-50 text-blue-700" : 
                            "bg-rose-50 text-rose-700"
                          )}>
                            {inv.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-1.5 transition-all duration-300">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl" asChild>
                              <Link href={`/admin/invoices/${inv.id}`}><Eye size={18} /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl" onClick={() => handleOpenEdit(inv)}>
                              <Edit size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive bg-rose-50 hover:bg-rose-100 rounded-xl" onClick={() => handleDeleteSingle(inv.id)} disabled={isSubmitting}>
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-32 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No active billing records synchronized.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INVOICE TERMINAL DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-full md:h-auto md:max-h-[90vh] p-0 border-none rounded-none md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] bg-white flex flex-col overflow-hidden">
          <header className="p-8 md:p-10 bg-[#081621] text-white flex justify-between items-center shrink-0 border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent scale-150" />
            <div className="space-y-1.5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary rounded-2xl shadow-[0_10px_40px_rgba(30,95,122,0.4)]"><ReceiptText size={28} /></div>
                <div>
                   <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight font-headline italic">
                      Invoice <span className="text-primary">Terminal</span>
                   </DialogTitle>
                   <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Manual Ledger Provisioning • v2.5</p>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white relative z-10"><X size={28}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 custom-scrollbar bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32 md:pb-0">
              
              {/* LEFT: INPUTS */}
              <div className="lg:col-span-7 space-y-12">
                
                {/* 👤 CLIENT ENGINE */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2"><Users size={16} /> Partner Identification</h4>
                    {customer.id && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] px-3 py-1">SYNCED WITH PROFILE</Badge>
                    )}
                  </div>
                  <div className="space-y-6 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Search Registry</Label>
                      <Select onValueChange={handleCustomerSelect}>
                        <SelectTrigger className="h-14 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-4 ring-primary/5 transition-all text-sm">
                          <SelectValue placeholder="Choose a registered customer..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[300px]">
                          {customersList?.map(u => (
                            <SelectItem key={u.id} value={u.id} className="py-3.5 font-bold text-xs uppercase tracking-tight">
                              {u.name} — <span className="text-primary font-black">{u.phone}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {customer.id && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in zoom-in-95">
                        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Total Invoiced</p>
                          <p className="text-xs font-black text-gray-900">৳{customer.totalInvoiced.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Total Paid</p>
                          <p className="text-xs font-black text-emerald-600">৳{customer.totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 shadow-sm text-center">
                          <p className="text-[8px] font-black text-rose-500 uppercase mb-1">Outstanding Due</p>
                          <p className="text-xs font-black text-rose-700">৳{customer.previousDue.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Client Name</Label>
                        <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="Label Display" className="h-12 bg-white border-none rounded-xl font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Contact Phone</Label>
                        <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-12 bg-white border-none rounded-xl font-bold text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Service/Site Address</Label>
                      <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="Precise location details..." className="min-h-[100px] bg-white border-none rounded-2xl p-6 shadow-sm font-medium text-sm leading-relaxed" />
                    </div>
                  </div>
                </div>

                {/* 🛠️ ITEM MATRIX */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2"><Wrench size={16} /> Item Matrix</h4>
                    <div className="flex gap-2">
                      <Select onValueChange={addServiceFromCatalog}>
                        <SelectTrigger className="h-10 w-52 bg-indigo-50 border-none rounded-xl font-black uppercase text-[10px] text-indigo-600 shadow-sm">
                          <SelectValue placeholder="Catalog Quick-Add" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {serviceCatalog?.map(s => (
                            <SelectItem key={s.id} value={s.id} className="py-3 font-bold text-[10px] uppercase">
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button type="button" onClick={addManualItem} className="rounded-xl h-10 px-4 text-[10px] font-black uppercase border-dashed border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all">+ Custom Row</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {manualItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                           <div className="lg:col-span-6 space-y-2">
                              <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Description</Label>
                              <Input value={item.name} onChange={e => updateManualItem(idx, 'name', e.target.value)} placeholder="Scope of work..." className="h-12 bg-white border-none rounded-xl text-sm font-bold shadow-sm" />
                           </div>
                           <div className="lg:col-span-2 space-y-2">
                              <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Unit</Label>
                              <Select value={item.unit} onValueChange={v => updateManualItem(idx, 'unit', v)}>
                                <SelectTrigger className="h-12 bg-white border-none rounded-xl text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {['Qty', 'Sqft', 'Pcs', 'Kg', 'Feet'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase py-2.5">{u}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="lg:col-span-2 space-y-2">
                              <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Rate</Label>
                              <Input type="number" value={item.price} onChange={e => updateManualItem(idx, 'price', e.target.value)} placeholder="৳" className="h-12 bg-white border-none rounded-xl font-black text-primary shadow-sm text-center" />
                           </div>
                           <div className="lg:col-span-1 space-y-2">
                              <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Qty</Label>
                              <Input type="number" value={item.quantity} onChange={e => updateManualItem(idx, 'quantity', e.target.value)} className="h-12 bg-white border-none rounded-xl font-black shadow-sm text-center" />
                           </div>
                           <div className="lg:col-span-1 pb-1 flex justify-center">
                              <Button variant="ghost" size="icon" onClick={() => removeManualItem(idx)} className="h-10 w-10 text-rose-400 hover:bg-rose-50 rounded-xl"><Trash2 size={20} /></Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: SUMMARY TERMINAL */}
              <div className="lg:col-span-5">
                <div className="bg-gray-50 p-8 md:p-10 rounded-[3rem] border border-gray-100 flex flex-col gap-10 h-fit sticky top-0 shadow-2xl">
                  <div className="space-y-8">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-[#081621] flex items-center gap-3"><Calculator size={20} /> Billing Strategy</h3>
                    
                    {/* Previous Due Selection */}
                    {unpaidInvoices.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-2">
                          <History size={14}/> Previous Arrears Found
                        </Label>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
                          {unpaidInvoices.map((inv) => (
                            <div 
                              key={inv.id} 
                              onClick={() => {
                                const next = selectedUnpaidIds.includes(inv.id) 
                                  ? selectedUnpaidIds.filter(id => id !== inv.id) 
                                  : [...selectedUnpaidIds, inv.id];
                                setSelectedUnpaidIds(next);
                              }}
                              className={cn(
                                "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
                                selectedUnpaidIds.includes(inv.id) ? "bg-rose-50 border-rose-500 shadow-sm" : "bg-white border-transparent"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", selectedUnpaidIds.includes(inv.id) ? "bg-rose-600" : "bg-gray-200")} />
                                <div>
                                  <p className="text-[10px] font-black text-gray-900 leading-none">{inv.invoiceNumber}</p>
                                  <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">{format(new Date(inv.createdAt), 'MMM dd')}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-rose-600">৳{inv.dueAmount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Discount Yield (৳)</Label>
                          <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-12 bg-white border-none rounded-xl font-black text-rose-600 shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">VAT Percentage (%)</Label>
                          <Input type="number" value={pricing.vatPercent} onChange={e => setPricing({...pricing, vatPercent: parseFloat(e.target.value) || 0})} className="h-12 bg-white border-none rounded-xl font-black shadow-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Logistics Charge (৳)</Label>
                          <Input type="number" value={pricing.delivery} onChange={e => setPricing({...pricing, delivery: parseFloat(e.target.value) || 0})} className="h-12 bg-white border-none rounded-xl font-black shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Amount Received (৳)</Label>
                          <Input type="number" value={pricing.paidAmount} onChange={e => setPricing({...pricing, paidAmount: parseFloat(e.target.value) || 0})} className="h-12 bg-emerald-50 border-none rounded-xl font-black text-emerald-600 shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Settlement Method</Label>
                        <Select value={pricing.paymentMethod} onValueChange={v => setPricing({...pricing, paymentMethod: v})}>
                          <SelectTrigger className="h-12 bg-white border-none rounded-xl font-black text-[10px] uppercase shadow-sm"><SelectValue/></SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'A/C Payee Check'].map(m => <SelectItem key={m} value={m} className="font-black text-[10px] uppercase py-3">{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 📊 DYNAMIC SUMMARY BLOCK */}
                    <div className="pt-10 border-t-4 border-white flex flex-col gap-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Services</span>
                        <span className="text-sm font-bold text-gray-700">৳{currentInvoiceTotal.toLocaleString()}</span>
                      </div>
                      {selectedPreviousDue > 0 && (
                        <div className="flex justify-between items-center px-2">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Previous Arrears</span>
                          <span className="text-sm font-black text-rose-700">৳{selectedPreviousDue.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-end px-2">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none">Net Grand Total</span>
                            <span className="text-5xl font-black text-[#081621] tracking-tighter leading-none whitespace-nowrap">৳{grandTotal.toLocaleString()}</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] px-4 py-1.5 rounded-lg shadow-sm">INC. PREV DUE</Badge>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "flex justify-between items-center p-6 rounded-[2rem] shadow-xl transition-all duration-500",
                        currentDue > 0 ? "bg-[#081621] text-white ring-4 ring-rose-500/20" : "bg-emerald-600 text-white shadow-emerald-600/20"
                      )}>
                        <div className="space-y-0.5">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">{currentDue > 0 ? 'Remaining Balance' : 'Full Settlements'}</span>
                           <p className={cn("text-2xl font-black tracking-tighter leading-none", currentDue > 0 ? "text-rose-400" : "text-white")}>
                             {currentDue > 0 ? `৳${currentDue.toLocaleString()}` : 'SETTLED'}
                           </p>
                        </div>
                        {currentDue <= 0 ? <ShieldCheck size={32} /> : <AlertCircle size={32} className="text-rose-400 animate-pulse" />}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50/80 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                    <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                    <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase tracking-tight">
                      Note: Previous due invoices will be automatically adjusted in FIFO order upon finalizing this transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 md:p-10 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 sm:flex-none h-14 md:h-16 px-12 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Discard Changes</Button>
            <Button onClick={handleSaveInvoice} disabled={isSubmitting} className="flex-1 h-14 md:h-16 rounded-2xl font-black bg-primary hover:bg-[#15435a] text-white shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] transition-all active:scale-95 text-xs">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-3" /> {editingInvoiceId ? 'Sync Updates' : 'Authorize & Launch Document'}</>}
            </Button>
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
