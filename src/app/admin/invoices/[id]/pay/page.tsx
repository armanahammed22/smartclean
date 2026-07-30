'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, updateDoc, increment, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Wallet, 
  Loader2, 
  CheckCircle2, 
  Save, 
  Banknote, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  User,
  History,
  Zap,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
        notes: paymentForm.notes || 'Settled via Payment Terminal'
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
      toast({ title: "Payment Recorded", description: `৳${amt} successfully adjusted in ledger.` });
      router.push('/admin/invoices');
    } catch (e) {
      toast({ variant: "destructive", title: "Process Error", description: "Failed to update financial records." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48}/><p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p></div>;
  if (!invoice) return <div className="p-32 text-center uppercase font-black opacity-20 tracking-[0.5em]">Invoice Not Found</div>;

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto min-w-0">
      <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl h-12 w-12 border hover:bg-gray-50 transition-all">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Payment Terminal</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5 flex items-center gap-2">
               <FileText size={12}/> Ref: {invoice.invoiceNumber}
            </p>
          </div>
        </div>
        <Badge className={cn("h-8 px-4 rounded-full font-black text-[9px] uppercase border-none tracking-[0.2em]", invoice.dueAmount > 0 ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
           {invoice.dueAmount > 0 ? 'PAYMENT DUE' : 'FULLY SETTLED'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Form */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20"><Wallet size={24} /></div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Record Collection</CardTitle>
                  <CardDescription className="text-white/40 font-bold uppercase text-[9px]">Authorize financial settlement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleRecordPayment} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Settlement Amount (৳)</Label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-600">৳</span>
                       <Input 
                        type="number" 
                        value={paymentForm.amount} 
                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                        className="h-14 pl-10 border-none bg-gray-50 rounded-2xl font-black text-xl text-emerald-700 shadow-inner focus:bg-white transition-all" 
                        required
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Payment Channel</Label>
                    <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                      <SelectTrigger className="h-14 bg-gray-50 border-none rounded-2xl font-black text-xs uppercase shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'A/C Payee Check'].map(m => (
                          <SelectItem key={m} value={m} className="py-3 font-black text-[10px] uppercase">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Reference Memo</Label>
                  <Textarea 
                    value={paymentForm.notes} 
                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} 
                    placeholder="e.g. Transaction ID, Check Number or Received By..." 
                    className="min-h-[120px] bg-gray-50 border-none rounded-[2rem] p-6 font-medium shadow-inner focus:bg-white transition-all"
                  />
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                  <AlertCircle size={24} className="text-amber-600 mt-1 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-amber-900">Audit Trail Active</h4>
                    <p className="text-[10px] font-medium text-amber-800/70 leading-relaxed uppercase">
                      This transaction will be logged in the Master Ledger and update the global cash balance automatically.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1 h-16 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Discard</Button>
                  <Button type="submit" disabled={isSubmitting || !paymentForm.amount} className="flex-[2] h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 gap-3 active:scale-95 transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 size={20} /> Authorize & Sync</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
               <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><FileText size={18} /> Billing Context</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-primary/5 text-primary rounded-2xl shrink-0"><User size={24}/></div>
                 <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Customer</p>
                    <p className="text-lg font-black text-gray-900 uppercase truncate">{invoice.customerInfo?.name}</p>
                    <p className="text-xs font-bold text-gray-500 mt-1">{invoice.customerInfo?.phone}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 border-y border-gray-50 py-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-gray-400">Grand Total</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tighter">৳{invoice.total?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-gray-400">Total Settled</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">৳{invoice.paidAmount?.toLocaleString()}</p>
                  </div>
               </div>

               <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-1">
                  <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Balance Pending</p>
                  <div className="flex justify-between items-end">
                    <h3 className="text-4xl font-black text-rose-600 tracking-tighter italic">৳{invoice.dueAmount?.toLocaleString()}</h3>
                    <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm"><Zap size={20} fill="currentColor"/></div>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-6 border-b flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><History size={16} /> History</CardTitle>
               <Badge className="bg-indigo-50 text-indigo-700 border-none text-[8px] font-black uppercase">{invoice.paymentHistory?.length || 0} TRNS</Badge>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-4">
                  {invoice.paymentHistory?.map((pay: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center group border-b border-gray-50 pb-3 last:border-none last:pb-0">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={14} strokeWidth={4}/></div>
                         <div>
                            <p className="text-[10px] font-black text-gray-900 uppercase leading-none">৳{pay.amount.toLocaleString()}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">{format(new Date(pay.date), 'MMM dd, yyyy')}</p>
                         </div>
                      </div>
                      <Badge variant="outline" className="text-[7px] font-black uppercase border-gray-100 bg-gray-50 text-gray-500">{pay.method}</Badge>
                    </div>
                  ))}
                  {!invoice.paymentHistory?.length && (
                    <div className="text-center py-10 opacity-20 grayscale"><Zap size={40} className="mx-auto mb-2" /><p className="text-[9px] font-black uppercase">No records found</p></div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

