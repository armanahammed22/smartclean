'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  Phone, 
  Globe,
  Mail,
  MapPin,
  Wallet,
  Zap,
  MessageCircle,
  FileText,
  Info,
  CheckCircle2,
  Printer,
  Heart,
  Check,
  Building2,
  ShieldCheck,
  CreditCard,
  Share2,
  MoreVertical,
  X,
  History,
  Clock,
  Banknote,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { downloadInvoicePDF, numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', notes: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.invoiceHeaderEmail || settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  
  const websiteName = settings?.websiteName || 'Smart Clean';
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || 'This is a computer generated document and does not require a physical stamp.';

  const isDue = (invoice?.dueAmount || 0) > 0;
  const isQuotation = invoice?.invoiceNumber?.startsWith('QTN');

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = `আসসালামু আলাইকুম, ইনভয়েস (${invoice.invoiceNumber}) টি চেক করার জন্য অনুরোধ করা হলো।`;
    window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRecordPayment = async () => {
    if (!db || !invoice || !paymentForm.amount) return;
    setIsProcessingPayment(true);

    const paidAmount = parseFloat(paymentForm.amount);
    const newTotalPaid = (invoice.paidAmount || 0) + paidAmount;
    const newDue = Math.max(0, invoice.total - newTotalPaid);
    const newStatus = newDue <= 0 ? 'Paid' : 'Partial';

    const paymentRecord = {
      id: 'pay_' + Date.now(),
      amount: paidAmount,
      date: new Date().toISOString(),
      method: paymentForm.method,
      notes: paymentForm.notes
    };

    try {
      // 1. Update Invoice
      await updateDoc(invoiceRef!, {
        paidAmount: newTotalPaid,
        dueAmount: newDue,
        paymentStatus: newStatus,
        paymentHistory: [...(invoice.paymentHistory || []), paymentRecord],
        updatedAt: serverTimestamp()
      });

      // 2. Update Customer Profile Overall Balance
      if (invoice.customerId) {
        const customerRef = doc(db, 'users', invoice.customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
          const cData = customerSnap.data();
          await updateDoc(customerRef, {
            totalPaid: (cData.totalPaid || 0) + paidAmount,
            outstandingBalance: Math.max(0, (cData.outstandingBalance || 0) - paidAmount),
            updatedAt: serverTimestamp()
          });
        }
      }

      toast({ title: "Payment Recorded", description: `Amount ৳${paidAmount} applied successfully.` });
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'Cash', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error recording payment" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-[10px] font-black uppercase text-gray-400">Loading Document...</p></div>;
  if (!invoice) return <div className="p-32 text-center uppercase font-black opacity-20 tracking-[0.5em]">Secure Ledger Missing</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  return (
    <div className="space-y-12 pb-32 md:pb-24 max-w-6xl mx-auto min-w-0">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        .invoice-table-wrapper { width: 100%; border-collapse: collapse; }
        .invoice-table-wrapper thead { display: table-header-group; }
        .invoice-table-wrapper tfoot { display: table-footer-group; }
      `}</style>

      {/* 🛠️ PREMIUM ADMIN ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print bg-[#081621] p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150"><FileText size={180} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/invoices')} className="rounded-2xl bg-white/10 hover:bg-white/20 h-14 w-14 border border-white/5 shadow-xl transition-all active:scale-90">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
                <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none px-3 h-5", isQuotation ? "bg-amber-50 text-black" : "bg-primary text-white")}>
                    {isQuotation ? 'OFFICIAL QUOTATION' : 'AUTHORIZED INVOICE'}
                </Badge>
                <Badge className={cn("text-[9px] font-black uppercase border-none px-3 h-5", isDue ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
                    {isDue ? 'PAYMENT DUE' : 'FULL SETTLED'}
                </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none font-headline italic">{invoice.invoiceNumber}</h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Document Audit Context: {invoice.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10">
          {isDue && (
            <Button onClick={() => setIsPaymentModalOpen(true)} className="gap-2 font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-2xl bg-emerald-600 hover:bg-emerald-700 text-white">
              <Banknote size={18} /> Add Payment
            </Button>
          )}
          <Button variant="outline" onClick={handleWhatsApp} className="gap-2 font-black uppercase text-[10px] h-12 px-6 border-emerald-500/30 text-emerald-400 bg-white/5 hover:bg-emerald-500/10">
            <MessageCircle size={18} /> WhatsApp Share
          </Button>
          <Button className="gap-2 font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-2xl bg-primary hover:bg-[#15435a] text-white" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={18} />} Export Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 📄 THE ACTUAL INVOICE DOCUMENT */}
        <div className="lg:col-span-8 flex justify-center animate-in fade-in zoom-in-95 duration-700">
          <div 
            id="invoice-render-area" 
            className="bg-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative border-t-[14px] border-[#1E5F7A] rounded-b-[2rem]"
            style={{ width: '210mm', minHeight: 'auto', color: '#333' }}
          >
            <table className="invoice-table-wrapper">
              <thead>
                <tr>
                  <td>
                    <div className="pt-10 px-12 pb-6 flex justify-between items-start border-b-[3px] border-gray-50 mb-10">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 relative shrink-0">
                          <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                        </div>
                        <div className="space-y-1 text-left">
                          <h2 className="text-2xl font-black text-[#081621] tracking-tighter uppercase leading-none">{websiteName}</h2>
                          <p className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">Professional Infrastructure</p>
                          <div className="h-1 bg-primary w-full mt-2" />
                        </div>
                      </div>
                      <div className="flex-1 text-right space-y-1">
                        <p className="text-[9px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
                        <p className="text-[9px] font-bold text-[#081621] uppercase">Cell: <span className="font-black">{headerPhone}</span></p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase">{headerEmail}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="px-12 pb-10">
                    <div className="flex justify-between items-start mb-12">
                      <div className="space-y-4 text-left">
                        <div>
                          <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-[0.3em] mb-2 border-b border-primary/20 pb-1 w-fit">Bill Recipient</p>
                          <h4 className="text-lg font-black text-[#081621] uppercase tracking-tight">{invoice.customerInfo.name}</h4>
                          <p className="text-[10px] font-black text-gray-600 mt-1">{invoice.customerInfo.phone}</p>
                          <p className="text-[9px] text-gray-500 font-medium leading-relaxed max-w-[350px] mt-1.5 uppercase italic">{invoice.customerInfo.address}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Document Ref.</p>
                          <p className="text-base font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Issue Date</p>
                          <p className="text-[11px] font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden border-2 border-[#081621] rounded-2xl shadow-sm mb-6">
                      <table className="w-full border-collapse">
                        <thead className="bg-[#081621] text-white">
                          <tr>
                            <th className="py-2 px-4 text-[9px] font-black uppercase w-12 text-center border-r border-white/10">#</th>
                            <th className="py-2 px-4 text-[9px] font-black uppercase text-left border-r border-white/10">Description</th>
                            <th className="py-2 px-4 text-[9px] font-black uppercase text-center w-20 border-r border-white/10">Qty</th>
                            <th className="py-2 px-4 text-[9px] font-black uppercase text-right w-28 border-r border-white/10">Rate</th>
                            <th className="py-2 px-4 text-[9px] font-black uppercase text-right w-32">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px] font-bold bg-white">
                          {invoice.items.map((item: any, i: number) => (
                            <tr key={i} className="border-t-2 border-gray-50">
                              <td className="py-3 text-center text-gray-400 border-r border-gray-50">{i + 1}</td>
                              <td className="py-3 px-4 uppercase text-gray-900 text-left border-r border-gray-50">{item.name}</td>
                              <td className="py-3 text-center text-gray-600 border-r border-gray-50">{item.quantity}</td>
                              <td className="py-3 px-4 text-right text-gray-600 border-r border-gray-50">৳{item.price?.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-[#081621] bg-gray-50/20">৳{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                          ))}
                          
                          <tr className="border-t-2 border-[#081621] bg-gray-50/50">
                            <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] tracking-widest border-r border-[#081621]">Subtotal</td>
                            <td className="py-2 px-4 text-right font-black text-xs text-[#081621]">৳{invoice.subtotal.toLocaleString()}</td>
                          </tr>

                          {invoice.previousDue > 0 && (
                            <tr className="border-t border-gray-100 bg-white">
                              <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] tracking-widest border-r border-[#081621] text-rose-500">Previous Arrears (+)</td>
                              <td className="py-2 px-4 text-right font-black text-xs text-rose-500">৳{invoice.previousDue.toLocaleString()}</td>
                            </tr>
                          )}

                          <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                            <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[10px] tracking-[0.2em] border-r border-white/10 italic">Grand Total</td>
                            <td className="py-3 px-4 text-right"><span className="text-sm font-black tracking-tight whitespace-nowrap">৳{invoice.total.toLocaleString()}</span></td>
                          </tr>

                          <tr className="border-t border-[#081621] bg-emerald-50/50">
                            <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] tracking-widest border-r border-[#081621] text-emerald-700 italic">Payments Collected (-)</td>
                            <td className="py-2 px-4 text-right font-black text-xs text-emerald-700">৳{invoice.paidAmount?.toLocaleString() || 0}</td>
                          </tr>

                          <tr className="border-t-2 border-[#081621] bg-rose-50/80">
                            <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] tracking-widest border-r border-[#081621] text-rose-700">Net Due Balance</td>
                            <td className="py-2 px-4 text-right font-black text-sm text-rose-700">৳{invoice.dueAmount?.toLocaleString() || 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col gap-1 text-left mb-8">
                      <p className="text-[7px] font-black uppercase text-gray-400 tracking-[0.3em]">Authorized Proof:</p>
                      <p className="text-[11px] font-black text-[#081621] italic">"{numberToWords(invoice.total)}"</p>
                    </div>
                  </td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <td className="px-12">
                    <div className="avoid-break grid grid-cols-2 gap-32 items-end pt-10 pb-10">
                      <div className="text-center space-y-4">
                        <div className="border-b-[3px] border-gray-100 h-10"></div>
                        <p className="text-[10px] font-black uppercase text-[#081621] tracking-tighter">Client Signature</p>
                      </div>
                      <div className="flex flex-col items-center justify-end text-center space-y-4">
                        <div className="h-16 w-32 relative border-b-[3px] border-primary/10 pb-2 flex items-center justify-center">
                          {signatureUrl ? (
                            <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized />
                          ) : (
                            <div className="text-[8px] font-black text-gray-300 border-2 border-dashed rounded-lg p-2 uppercase">Official Sign</div>
                          )}
                        </div>
                        <p className="font-black text-[10px] uppercase text-[#081621] tracking-tighter leading-none">Authorized Control</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 📊 AUDIT SIDEBAR (Multiple Payments) */}
        <div className="lg:col-span-4 no-print space-y-8">
           <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
                 <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><History size={18} /> Payment Feed</CardTitle>
                 <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[8px]">{invoice.paymentHistory?.length || 0} TRX</Badge>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="space-y-6">
                    {invoice.paymentHistory?.map((pay: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 relative group">
                        {idx !== invoice.paymentHistory.length - 1 && <div className="absolute left-4 top-10 w-0.5 h-10 bg-gray-100" />}
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 z-10"><CheckCircle2 size={16}/></div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                              <p className="font-black text-xs text-gray-900">৳{pay.amount.toLocaleString()}</p>
                              <span className="text-[8px] font-bold text-gray-400 uppercase">{format(new Date(pay.date), 'MMM dd')}</span>
                           </div>
                           <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">{pay.method} • {pay.notes || 'No notes'}</p>
                        </div>
                      </div>
                    ))}
                    {!invoice.paymentHistory?.length && (
                      <div className="text-center py-10 opacity-20"><Zap size={40} className="mx-auto"/><p className="text-[10px] font-black mt-2">NO PAYMENTS LOGGED</p></div>
                    )}
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><ShieldCheck size={120} /></div>
              <CardContent className="p-8 space-y-6 relative z-10">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Uncollected Arrears</p>
                    <h3 className="text-4xl font-black tracking-tighter italic">৳{invoice.dueAmount?.toLocaleString()}</h3>
                 </div>
                 <div className="p-4 bg-white/10 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase"><span>Settled</span><span>৳{invoice.paidAmount?.toLocaleString()}</span></div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${(invoice.paidAmount / invoice.total) * 100}%` }} />
                    </div>
                 </div>
                 {isDue && (
                   <Button onClick={() => setIsPaymentModalOpen(true)} className="w-full h-12 bg-white text-indigo-600 hover:bg-gray-100 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl">
                      Record New Receipt
                   </Button>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* 🛠️ PAYMENT MODAL */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <header className="p-8 bg-[#081621] text-white shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-primary rounded-xl"><Wallet size={24}/></div>
               <div><DialogTitle className="text-xl font-black uppercase tracking-tight">Record Receipt</DialogTitle></div>
             </div>
          </header>
          <div className="p-8 space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Collection Amount (৳)</Label>
                   <Input 
                      type="number" 
                      value={paymentForm.amount} 
                      onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                      max={invoice.dueAmount}
                      className="h-14 bg-gray-50 border-none rounded-2xl font-black text-xl text-emerald-600 shadow-inner" 
                   />
                   <p className="text-[9px] text-muted-foreground italic px-1">Maximum allowed: ৳{invoice.dueAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Payment Gateway</Label>
                   <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                         {['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Rocket', 'Upay'].map(m => <SelectItem key={m} value={m} className="font-bold text-xs uppercase py-3">{m}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Reference / Notes</Label>
                   <Textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="e.g. Received via bKash App" className="bg-gray-50 border-none rounded-xl" />
                </div>
             </div>
          </div>
          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-3">
             <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
             <Button onClick={handleRecordPayment} disabled={isProcessingPayment || !paymentForm.amount} className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-emerald-600/20">
                {isProcessingPayment ? <Loader2 className="animate-spin" /> : "Authorize Receipt"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
