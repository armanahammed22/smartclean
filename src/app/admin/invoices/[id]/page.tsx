
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDoc, writeBatch, increment } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  MapPin, 
  Wallet, 
  ShieldCheck, 
  MessageCircle, 
  FileText, 
  CheckCircle2, 
  History, 
  Zap, 
  AlertCircle,
  X,
  Banknote,
  Printer,
  Star
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

  const designRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'document_design') : null, [db]);
  const { data: design } = useDoc(designRef);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.invoiceHeaderEmail || settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'GP.JA-66/2, Wireless Gate, Mohakhali, Dhaka-1212';
  
  const websiteName = settings?.websiteName || 'Smart Clean';
  const tagline = invoice?.tagline || settings?.invoiceTagline || "Smart Cleaning, Better Living.";
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || 'This is a computer generated document and does not require a physical stamp.';

  const isDue = (invoice?.dueAmount || 0) > 0;
  const isQuotation = invoice?.invoiceNumber?.startsWith('QTN');

  const providedServices = useMemo(() => {
    const list = settings?.invoiceProvidedServices || 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control';
    return list.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }, [settings]);

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = `আসসালামু আলাইকুম, ইনভয়েস (${invoice.invoiceNumber}) টি চেক করার জন্য অনুরোধ করা হলো।`;
    window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRecordPayment = async () => {
    if (!db || !invoice || !paymentForm.amount) return;
    setIsProcessingPayment(true);

    let paymentRemaining = parseFloat(paymentForm.amount);
    const initialPaymentAmount = paymentRemaining;
    const batch = writeBatch(db);

    try {
      // 1. Settle Previous Invoices (FIFO)
      if (invoice.previousDueIds && invoice.previousDueIds.length > 0) {
        for (const prevId of invoice.previousDueIds) {
          if (paymentRemaining <= 0) break;

          const prevRef = doc(db, 'invoices', prevId);
          const prevSnap = await getDoc(prevRef);
          
          if (prevSnap.exists()) {
            const prevData = prevSnap.data();
            const currentDue = prevData.dueAmount || 0;
            
            if (currentDue > 0) {
              const appliedToPrev = Math.min(paymentRemaining, currentDue);
              const newPrevPaid = (prevData.paidAmount || 0) + appliedToPrev;
              const newPrevDue = currentDue - appliedToPrev;
              const newPrevStatus = newPrevDue <= 0 ? 'Paid' : 'Partial';

              batch.update(prevRef, {
                paidAmount: newPrevPaid,
                dueAmount: newPrevDue,
                paymentStatus: newPrevStatus,
                paymentHistory: [...(prevData.paymentHistory || []), {
                  id: 'pay_cf_' + Date.now(),
                  amount: appliedToPrev,
                  date: new Date().toISOString(),
                  method: paymentForm.method,
                  notes: `Settled via Carried Forward Invoice ${invoice.invoiceNumber}`
                }],
                updatedAt: serverTimestamp()
              });

              paymentRemaining -= appliedToPrev;
            }
          }
        }
      }

      // 2. Update Current Invoice
      const newTotalPaid = (invoice.paidAmount || 0) + initialPaymentAmount;
      const newDue = Math.max(0, invoice.total - newTotalPaid);
      const newStatus = newDue <= 0 ? 'Paid' : 'Partial';

      const paymentRecord = {
        id: 'pay_' + Date.now(),
        amount: initialPaymentAmount,
        date: new Date().toISOString(),
        method: paymentForm.method,
        notes: paymentForm.notes
      };

      batch.update(invoiceRef!, {
        paidAmount: newTotalPaid,
        dueAmount: newDue,
        paymentStatus: newStatus,
        paymentHistory: [...(invoice.paymentHistory || []), paymentRecord],
        updatedAt: serverTimestamp()
      });

      // 3. Update Customer Overall Balance
      if (invoice.customerId) {
        const customerRef = doc(db, 'users', invoice.customerId);
        batch.update(customerRef, {
          totalPaid: increment(initialPaymentAmount),
          outstandingBalance: increment(-initialPaymentAmount),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      toast({ title: "Payment Synchronized", description: `৳${initialPaymentAmount} processed across ledger.` });
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'Cash', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Settlement Error", description: "Failed to update financial records." });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-[10px] font-black uppercase text-gray-400">Loading Document...</p></div>;
  if (!invoice) return <div className="p-32 text-center uppercase font-black opacity-20 tracking-[0.5em]">Secure Ledger Missing</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  const d = design || {
    primaryColor: '#1E5F7A',
    headerPaddingTop: 5,
    headerPaddingBottom: 5,
    sectionSpacing: 10,
    tableFontSize: 10.5,
    tableRowPadding: 2,
    headerFontSize: 22,
    bodyFontSize: 11,
    logoSize: 52,
    showGridLines: true,
    footerMarginTop: 5,
    footerPaddingBottom: 5,
    signatureSpacing: 25,
    taglineFontSize: 11,
    disclaimerFontSize: 7.5
  };

  return (
    <div className="space-y-12 pb-32 md:pb-24 max-w-6xl mx-auto min-w-0">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 🛠️ ACTION BAR */}
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
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none italic">{invoice.invoiceNumber}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10">
          {isDue && (
            <Button onClick={() => setIsPaymentModalOpen(true)} className="gap-2 font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-xl shadow-primary/20 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Banknote size={18} /> Add Payment
            </Button>
          )}
          <Button variant="outline" onClick={handleWhatsApp} className="gap-2 font-black uppercase text-[10px] h-12 px-6 border-emerald-500/30 text-emerald-400 bg-white/5 hover:bg-emerald-500/10">
            <MessageCircle size={18} /> WhatsApp Share
          </Button>
          <Button className="gap-2 font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-xl shadow-primary/20 bg-primary hover:bg-[#15435a] text-white" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={18} />} Export Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 📄 DOCUMENT RENDER AREA */}
        <div className="lg:col-span-8 flex justify-center animate-in fade-in zoom-in-95 duration-700">
          <div 
            id="invoice-render-area" 
            className="bg-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative border-t-[14px] border-[#1E5F7A] rounded-b-[2rem]"
            style={{ width: '210mm', minHeight: 'auto', color: '#333' }}
          >
            <div className="px-12 flex justify-between items-start border-b-[3px] border-gray-50" style={{ paddingTop: `${d.headerPaddingTop}px`, paddingBottom: `${d.headerPaddingBottom}px` }}>
              <div className="flex gap-4">
                <div className="relative shrink-0" style={{ width: `${d.logoSize}px`, height: `${d.logoSize}px` }}>
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                </div>
                <div className="space-y-0.5 text-left flex flex-col justify-center">
                  <h2 className="font-black text-[#081621] tracking-tighter uppercase leading-none" style={{ fontSize: `${d.headerFontSize}px` }}>{websiteName}</h2>
                  <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: d.primaryColor }}>Professional Infrastructure</p>
                </div>
              </div>
              <div className="text-right max-w-[280px]">
                <p className="text-[8px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
                <p className="text-[8px] font-bold text-[#081621] uppercase mt-1">Cell: <span className="font-black">{headerPhone}</span></p>
              </div>
            </div>

            <div className="px-12 pb-10 flex-1" style={{ marginTop: `${d.sectionSpacing}px` }}>
              <div className="text-center space-y-1 mb-10">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic text-[#081621]">Tax Invoice / Bill</h3>
                  <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: d.primaryColor }} />
              </div>

              <div className="flex justify-between items-start mb-12">
                <div className="text-left space-y-4">
                  <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5 w-fit">Recipient Profile</p>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-[#081621] uppercase tracking-tight">{invoice.customerInfo.name}</h4>
                    <p className="text-[10px] font-bold text-gray-600">{invoice.customerInfo.phone}</p>
                    <p className="text-[9px] text-gray-500 font-medium leading-relaxed max-w-[350px] uppercase italic">{invoice.customerInfo.address}</p>
                  </div>
                </div>
                <div className="text-right space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Document Ref.</p>
                    <p className="text-base font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Issue Date</p>
                    <p className="text-[11px] font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className={cn("overflow-hidden rounded-xl mb-6", d.showGridLines ? "border-2 border-[#081621]" : "border-none shadow-sm")}>
                <table className="w-full border-collapse text-[10px]">
                  <thead className="bg-[#081621] text-white">
                    <tr>
                      <th className="py-3 px-4 font-black uppercase text-left w-12">SL</th>
                      <th className="py-3 px-4 font-black uppercase text-left">Service Components</th>
                      <th className="py-3 px-4 font-black uppercase text-center w-28">Unit/Area</th>
                      <th className="py-3 px-4 font-black uppercase text-right w-28">Unit Price</th>
                      <th className="py-3 px-4 font-black uppercase text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold bg-white">
                    {invoice.items.map((item: any, i: number) => (
                      <tr key={i} className="border-t-2 border-gray-50 align-top">
                        <td className="px-4 text-left text-gray-400" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>{i + 1}</td>
                        <td className="px-4 text-left" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>
                          <p className="font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                        </td>
                        <td className="px-4 text-center text-gray-600 uppercase font-black" style={{ fontSize: `${d.tableFontSize}px` }}>{item.quantity} {item.unit || 'PCS'}</td>
                        <td className="px-4 text-right text-gray-600" style={{ fontSize: `${d.tableFontSize}px` }}>৳{item.price.toLocaleString()}</td>
                        <td className="px-4 text-right text-[#081621] font-black" style={{ fontSize: `${d.tableFontSize}px` }}>৳{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                    
                    <tr className="border-t-[3px] border-[#081621] bg-gray-50/50">
                      <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[9px] tracking-widest">Base Subtotal</td>
                      <td className="py-3 px-4 text-right font-black text-xs">৳{invoice.subtotal.toLocaleString()}</td>
                    </tr>

                    {invoice.previousDue > 0 && (
                      <tr className="border-t border-gray-100 bg-white">
                        <td colSpan={4} className="py-2.5 px-8 text-right font-black uppercase text-[9px] tracking-widest text-rose-500">Previous Arrears</td>
                        <td className="py-2.5 px-4 text-right font-black text-xs text-rose-500">৳{invoice.previousDue.toLocaleString()}</td>
                      </tr>
                    )}

                    <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                      <td colSpan={4} className="py-4 px-8 text-right font-black uppercase text-[10px] tracking-[0.2em] italic">Net Payable Amount</td>
                      <td className="py-4 px-4 text-right font-black text-sm">৳{invoice.total.toLocaleString()}</td>
                    </tr>

                    <tr className="border-t border-[#081621] bg-emerald-50/50 text-emerald-700">
                      <td colSpan={4} className="py-2.5 px-8 text-right font-black uppercase text-[9px]">Received (-)</td>
                      <td className="py-2.5 px-4 text-right font-black text-xs">৳{invoice.paidAmount?.toLocaleString() || 0}</td>
                    </tr>

                    <tr className="border-t-[3px] border-[#081621] bg-rose-50/80 text-rose-700">
                      <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[10px] tracking-widest italic">Net Balance Due</td>
                      <td className="py-3 px-4 text-right font-black text-xs">৳{invoice.dueAmount?.toLocaleString() || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col gap-1 text-left mb-8">
                <p className="text-[7px] font-black uppercase text-gray-400 tracking-[0.3em]">Amount in Words:</p>
                <p className="text-[10px] font-black text-[#081621] italic">"{numberToWords(invoice.total)}"</p>
              </div>

              {invoice.terms && invoice.terms.length > 0 && (
                <div className="space-y-2 mb-8">
                   <h5 className="text-[9px] font-black uppercase tracking-widest border-b border-primary/20 pb-0.5 w-fit" style={{ color: d.primaryColor }}>Terms & Conditions</h5>
                   <div className="grid grid-cols-1 gap-1">
                      {invoice.terms.map((term: string, i: number) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-[9px] font-black" style={{ color: d.primaryColor }}>{i + 1}.</span>
                          <p className="text-[9px] font-medium text-gray-600 leading-tight">{term}</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="avoid-break grid grid-cols-2 gap-32 items-end pt-10" style={{ marginTop: `${d.signatureSpacing}px` }}>
                <div className="text-center space-y-4">
                  <div className="border-b-[3px] border-gray-100 h-10"></div>
                  <p className="text-[10px] font-black uppercase text-[#081621]">Client Signature</p>
                </div>
                <div className="flex flex-col items-center justify-end text-center space-y-4">
                  <div className="h-16 w-32 relative border-b-[3px] border-primary/10 flex items-center justify-center">
                    {signatureUrl ? <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized /> : <div className="text-[8px] font-black text-gray-300 uppercase">Authorized</div>}
                  </div>
                  <p className="font-black text-[10px] uppercase text-[#081621]">Smart Clean Authority</p>
                </div>
              </div>
            </div>

            <footer className="pt-6 border-t border-gray-100 px-12" style={{ marginTop: `${d.footerMarginTop}px`, paddingBottom: `${d.footerPaddingBottom}px` }}>
              <div className="text-center space-y-0.5 mb-2">
                  <p className="font-black flex items-center justify-center gap-2 uppercase tracking-widest" style={{ fontSize: `${d.taglineFontSize}px`, color: d.primaryColor }}>{tagline} <Star size={8} fill="currentColor"/></p>
              </div>
              
              <div className="grid grid-cols-3 gap-x-6 gap-y-0.5">
                  {Array.from({ length: 3 }).map((_, colIdx) => (
                    <div key={colIdx} className="space-y-0.5">
                        {providedServices.filter((_: string, i: number) => i % 3 === colIdx).map((service: string, sIdx: number) => (
                        <div key={sIdx} className="flex items-center gap-2">
                            <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold text-gray-600 uppercase truncate">{service}</span>
                        </div>
                        ))}
                    </div>
                  ))}
              </div>

              <p className="font-bold uppercase text-center mt-3 tracking-[0.3em] text-gray-300" style={{ fontSize: `${d.disclaimerFontSize}px` }}>{footerDisclaimer}</p>
            </footer>
          </div>
        </div>

        {/* 📊 AUDIT SIDEBAR */}
        <div className="lg:col-span-4 no-print space-y-8">
           <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
              <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
                 <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><History size={18} /> Settlement Log</CardTitle>
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
                           <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">{pay.method} • {pay.notes || 'Ledger Entry'}</p>
                        </div>
                      </div>
                    ))}
                    {!invoice.paymentHistory?.length && (
                      <div className="text-center py-10 opacity-20"><Zap size={40} className="mx-auto"/><p className="text-[10px] font-black mt-2">NO PAYMENTS LOGGED</p></div>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* 🛠️ PAYMENT MODAL (MOBILE FRIENDLY) */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white flex flex-col max-h-[90vh]">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-primary rounded-xl"><Wallet size={24}/></div>
               <div><DialogTitle className="text-xl font-black uppercase tracking-tight">Record Receipt</DialogTitle></div>
             </div>
             <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60"><X size={20}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Amount to Settle (৳)</Label>
                   <Input 
                      type="number" 
                      value={paymentForm.amount} 
                      onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                      className="h-12 md:h-14 bg-gray-50 border-none rounded-2xl font-black text-lg text-emerald-600 shadow-inner" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Payment Gateway</Label>
                   <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                      <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl z-[300]">
                         {['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'A/C Payee Check'].map(m => <SelectItem key={m} value={m} className="font-bold text-xs uppercase py-3">{m}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Reference / Notes</Label>
                   <Textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="e.g. Received via bKash App" className="bg-gray-50 border-none rounded-xl min-h-[80px]" />
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                   <AlertCircle size={18} className="text-amber-600 mt-1" />
                   <p className="text-[10px] font-bold text-amber-700 leading-normal uppercase">
                     FIFO Settlement Active: Payment applies to oldest arrears first.
                   </p>
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t flex flex-row gap-3 shrink-0">
             <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 rounded-xl h-12 md:h-14 font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
             <Button onClick={handleRecordPayment} disabled={isProcessingPayment || !paymentForm.amount} className="flex-1 h-12 md:h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                {isProcessingPayment ? <Loader2 className="animate-spin" /> : "Verify & Authorize"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
