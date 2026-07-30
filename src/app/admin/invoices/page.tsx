'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, writeBatch, limit, increment, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Trash2, 
  Eye, 
  Edit, 
  Loader2, 
  Filter, 
  Zap,
  Plus,
  Banknote,
  ShieldCheck,
  Clock,
  FileText,
  Wallet,
  X,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function InvoicesListContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Quick Payment State
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', notes: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoicesQuery = useMemoFirebase(() => db ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(100)) : null, [db]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

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

  const handleRecordPayment = async () => {
    if (!db || !paymentTarget || !paymentForm.amount) return;
    setIsPaymentProcessing(true);
    const amt = parseFloat(paymentForm.amount);
    const batch = writeBatch(db);

    try {
      const invoiceRef = doc(db, 'invoices', paymentTarget.id);
      const newPaid = (paymentTarget.paidAmount || 0) + amt;
      const newDue = Math.max(0, paymentTarget.total - newPaid);
      const newStatus = newDue <= 0 ? 'Paid' : 'Partial';

      const record = {
        id: 'pay_lst_' + Date.now(),
        amount: amt,
        date: new Date().toISOString(),
        method: paymentForm.method,
        notes: paymentForm.notes || 'Settled from list view'
      };

      batch.update(invoiceRef, {
        paidAmount: newPaid,
        dueAmount: newDue,
        paymentStatus: newStatus,
        paymentHistory: [...(paymentTarget.paymentHistory || []), record],
        updatedAt: serverTimestamp()
      });

      if (paymentTarget.customerId) {
        const customerRef = doc(db, 'users', paymentTarget.customerId);
        batch.update(customerRef, {
          totalPaid: increment(amt),
          outstandingBalance: increment(-amt),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast({ title: "Payment Synchronized", description: `৳${amt} has been recorded.` });
      setPaymentTarget(null);
      setPaymentForm({ amount: '', method: 'Cash', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Settlement Error" });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Billing Registry</h1>
          <p className="text-muted-foreground text-sm font-medium">Enterprise financial documentation & history</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10 gap-2">
            <Link href="/admin/invoices/new"><Plus size={16} strokeWidth={3} /> New Invoice</Link>
          </Button>
        </div>
      </div>

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
                    <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Actions</TableHead>
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
                          inv.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>{inv.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-100">
                          {inv.dueAmount > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                              onClick={() => { setPaymentTarget(inv); setPaymentForm({ ...paymentForm, amount: inv.dueAmount.toString() }); }}
                              title="Record Payment"
                            >
                              <Banknote size={16} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild><Link href={`/invoice/${inv.invoiceNumber}`}><Eye size={16} /></Link></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" asChild><Link href={`/admin/invoices/${inv.id}/edit`}><Edit size={16} /></Link></Button>
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

      {/* 🛠️ QUICK PAYMENT MODAL */}
      <Dialog open={!!paymentTarget} onOpenChange={() => setPaymentTarget(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-xl"><Wallet size={24}/></div>
              <div><DialogTitle className="text-xl font-black uppercase tracking-tight">Invoice Settlement</DialogTitle></div>
            </div>
          </header>
          <div className="p-8 space-y-6">
             <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Target Reference</p>
                   <p className="text-sm font-black text-[#081621] font-mono">{paymentTarget?.invoiceNumber}</p>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Payment Amount (৳)</Label>
                   <Input 
                      type="number" 
                      value={paymentForm.amount} 
                      onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                      className="h-14 bg-gray-50 border-none rounded-2xl font-black text-xl text-emerald-600 shadow-inner" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Gateway</Label>
                   <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                         {['Cash', 'bKash', 'Nagad', 'Bank Transfer'].map(m => <SelectItem key={m} value={m} className="font-bold text-xs uppercase py-3">{m}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Notes</Label>
                   <Textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Reference details..." className="bg-gray-50 border-none rounded-xl" />
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-3">
             <Button variant="ghost" onClick={() => setPaymentTarget(null)} className="flex-1 rounded-xl">Discard</Button>
             <Button onClick={handleRecordPayment} disabled={isPaymentProcessing || !paymentForm.amount} className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-emerald-600/20">
                {isPaymentProcessing ? <Loader2 className="animate-spin" /> : "Verify & Authorize"}
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
