'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, updateDoc, increment, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Wallet, 
  Loader2, 
  CheckCircle2, 
  Save, 
  Banknote, 
  FileText,
  User,
  History,
  Zap,
  Calculator,
  Calendar,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function InvoicePaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', notes: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  useEffect(() => {
    if (invoice) {
      setPaymentForm(prev => ({ ...prev, amount: invoice.dueAmount.toString() }));
    }
  }, [invoice]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !invoice || !paymentForm.amount) return;
    
    setIsSubmitting(true);
    const amt = parseFloat(paymentForm.amount);
    const batch = writeBatch(db);

    try {
      const invRef = doc(db, 'invoices', invoice.id);
      const newPaid = (invoice.paidAmount || 0) + amt;
      const newDue = Math.max(0, invoice.total - newPaid);
      const newStatus = newDue <= 0 ? 'Paid' : 'Partial';

      const record = {
        id: 'pay_stc_' + Date.now(),
        amount: amt,
        date: new Date().toISOString(),
        method: paymentForm.method,
        notes: paymentForm.notes || 'Settled via Terminal'
      };

      batch.update(invRef, {
        paidAmount: newPaid,
        dueAmount: newDue,
        paymentStatus: newStatus,
        paymentHistory: [...(invoice.paymentHistory || []), record],
        updatedAt: serverTimestamp()
      });

      if (invoice.customerId) {
        const customerRef = doc(db, 'users', invoice.customerId);
        batch.update(customerRef, {
          totalPaid: increment(amt),
          outstandingBalance: increment(-amt),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast({ title: "পেমেন্ট সম্পন্ন হয়েছে", description: `৳${amt} লেজারে যুক্ত করা হয়েছে।` });
      router.push('/admin/invoices');
    } catch (e) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে" });
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48}/><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p></div>;
  if (!invoice) return <div className="p-32 text-center uppercase font-black opacity-20 tracking-[0.5em]">Invoice Not Found</div>;

  return (
    <div className="space-y-4 pb-20 max-w-6xl mx-auto min-w-0 -mt-6">
      {/* 🛠️ HEADER ACTION BAR */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border hover:bg-gray-50">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Payment Settlement</h1>
        </div>
        <div className="flex items-center gap-2">
           <Badge className={cn("h-7 px-3 rounded-lg font-black text-[9px] uppercase border-none", invoice.dueAmount > 0 ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
              {invoice.dueAmount > 0 ? 'DUE PENDING' : 'SETTLED'}
           </Badge>
           <Button onClick={handleRecordPayment} disabled={isSubmitting || !paymentForm.amount} className="h-9 px-8 rounded-lg font-black uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2 active:scale-95 transition-all">
             {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Authorize Payment</>}
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 📋 INVOICE & CUSTOMER INFO ROW */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <FileText size={12} /> Document Context
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-gray-400 uppercase">Invoice Ref</Label>
                <p className="text-xs font-black text-primary font-mono">{invoice.invoiceNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-gray-400 uppercase">Client Name</Label>
                <p className="text-xs font-bold text-gray-900 uppercase truncate">{invoice.customerInfo?.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-gray-400 uppercase">Grand Total</Label>
                <p className="text-xs font-black text-gray-900">৳{invoice.total?.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-gray-400 uppercase">Total Settled</Label>
                <p className="text-xs font-black text-emerald-600">৳{invoice.paidAmount?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 💰 PAYMENT ENTRY ROW */}
        <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <CreditCard size={12} /> Transaction Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-xl border">
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Receive Amount (৳)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
                  <Input 
                    type="number" 
                    value={paymentForm.amount} 
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                    className="h-10 pl-9 font-black text-emerald-700 bg-white border-none shadow-sm rounded-lg" 
                  />
                </div>
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Payment Method</Label>
                <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                  <SelectTrigger className="h-10 bg-white border-none rounded-lg font-bold text-[11px] uppercase shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Cheque'].map(m => (
                      <SelectItem key={m} value={m} className="text-[10px] font-bold uppercase">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Memo / Reference</Label>
                <Input 
                  value={paymentForm.notes} 
                  onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} 
                  placeholder="e.g. Transaction ID or Short Note"
                  className="h-10 bg-white border-none rounded-lg font-medium text-xs shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📊 HISTORY & CALCULATION BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
             <div className="flex items-center gap-2 px-1">
                <History size={14} className="text-primary"/>
                <Label className="text-[10px] font-black uppercase text-gray-400">Payment Log History</Label>
             </div>
             <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-[9px] font-black uppercase py-2 pl-5">Date</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-center">Method</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-right pr-5">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.paymentHistory?.map((pay: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-gray-50/50">
                        <TableCell className="py-2 pl-5 text-[10px] font-bold text-gray-500">{format(new Date(pay.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="text-[8px] font-black border-none bg-blue-50 text-blue-600 uppercase">{pay.method}</Badge></TableCell>
                        <TableCell className="text-right pr-5 font-black text-xs text-gray-900">৳{pay.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {!invoice.paymentHistory?.length && (
                      <TableRow><TableCell colSpan={3} className="py-8 text-center text-gray-300 text-[10px] uppercase tracking-widest font-black italic">No records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
             </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-xl rounded-2xl bg-slate-50 border border-gray-100 overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <span>Current Arrears</span>
                     <span className="text-rose-500">৳{invoice.dueAmount?.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <span>Entering Payment</span>
                     <span className="text-emerald-600">+৳{(parseFloat(paymentForm.amount) || 0).toLocaleString()}</span>
                   </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">New Net Due</span>
                    <span className="text-4xl font-black text-[#081621] tracking-tighter italic">
                      ৳{Math.max(0, invoice.dueAmount - (parseFloat(paymentForm.amount) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
