'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { downloadInvoicePDF, numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const providedServicesList = useMemo(() => {
    if (settings?.invoiceProvidedServices) {
      return settings.invoiceProvidedServices.split(',').map((s: string) => s.trim()).filter((s: string) => !!s);
    }
    return ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Sofa & Carpet', 'Kitchen Sanitization', 'Pest Control'];
  }, [settings]);

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;
  if (!invoice) return <div className="p-20 text-center uppercase font-black opacity-20">Document Not Found</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.invoiceHeaderEmail || settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  
  const websiteName = settings?.websiteName || 'Smart Clean';
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || 'This is a computer generated document and does not require a physical stamp.';

  const isDue = (invoice.dueAmount || 0) > 0;

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Authorized Document Control</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11 px-6 rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50" asChild>
            <a href={`https://wa.me/${headerPhone.replace(/\D/g, '')}`} target="_blank"><MessageCircle size={18} /> Send to WhatsApp</a>
          </Button>
          <Button className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 bg-[#1E5F7A] text-white" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={18} />} EXPORT PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 overflow-x-auto no-scrollbar pb-10">
          <div 
            id="invoice-render-area" 
            className="bg-white shadow-2xl relative mx-auto"
            style={{ width: '210mm', minHeight: '297mm', color: '#333', overflow: 'visible', display: 'flex', flexDirection: 'column' }}
          >
            {/* 🖼️ CORPORATE HEADER */}
            <div className="pt-12 px-12 pb-8 flex justify-between items-start border-b-2 border-gray-100 shrink-0">
               <div className="flex gap-4">
                 <div className="w-20 h-20 relative shrink-0">
                    <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-[#081621] tracking-tighter uppercase leading-none">{websiteName}</h2>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Better Security, Better Solution</p>
                    <div className="h-0.5 bg-primary w-full mt-2" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pt-1">Corporate Branch</p>
                 </div>
               </div>

               <div className="h-20 w-px bg-gray-300 mx-6 hidden sm:block" />

               <div className="flex-1 text-right sm:text-left space-y-1">
                  <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase">{headerAddress}</p>
                  <p className="text-[9px] font-bold text-gray-600 uppercase">Mobile: {headerPhone}</p>
                  <p className="text-[9px] font-bold text-gray-600 uppercase">E-mail: {headerEmail}</p>
                  <p className="text-[9px] font-bold text-gray-600 uppercase">Web: smartclean.com.bd</p>
               </div>
            </div>

            <div className="px-12 pt-8 space-y-8 flex-1 relative z-10">
               <div className="text-center space-y-1">
                  <h3 className="text-2xl font-black uppercase text-[#081621] tracking-tighter underline underline-offset-4 decoration-primary/30">Invoice / Bill</h3>
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDue ? "text-rose-600" : "text-emerald-600")}>
                    ({isDue ? 'DUE' : 'PAID'})
                  </p>
               </div>

               <div className="flex justify-between items-start">
                  <div className="space-y-3 text-left">
                    <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-1 w-fit">Invoiced To:</p>
                    <div className="space-y-0.5">
                        <p className="text-lg font-black text-[#081621] uppercase leading-tight">{invoice.customerInfo.name}</p>
                        <p className="text-[10px] font-bold text-gray-700">{invoice.customerInfo.phone}</p>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-[320px] mt-1">{invoice.customerInfo.address}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-widest">Doc Reference</p>
                        <p className="text-base font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-widest">Date</p>
                        <p className="text-xs font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                    </div>
                  </div>
               </div>

               <div className="overflow-hidden border border-[#081621] rounded-2xl shadow-sm">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#1E5F7A] text-white">
                      <tr>
                        <th className="py-2.5 px-4 text-[9px] font-black border-r border-[#081621] uppercase w-12 text-center">SL.</th>
                        <th className="py-2.5 px-4 text-[9px] font-black border-r border-[#081621] uppercase text-left">Description</th>
                        <th className="py-2.5 px-4 text-[9px] font-black border-r border-[#081621] uppercase text-center w-24">Qty/Unit</th>
                        <th className="py-2.5 px-4 text-[9px] font-black border-r border-[#081621] uppercase text-center w-28">Rate (৳)</th>
                        <th className="py-2.5 px-4 text-[9px] font-black uppercase text-center w-32">Total (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-medium bg-white">
                      {invoice.items.map((item: any, i: number) => (
                        <tr key={i} className="border-t border-[#081621]">
                          <td className="py-3 text-center border-r border-[#081621] font-black text-gray-400">{i + 1}</td>
                          <td className="py-3 px-4 border-r border-[#081621] font-black uppercase text-gray-800 text-left">{item.name}</td>
                          <td className="py-3 text-center border-r border-[#081621] font-black text-gray-700">
                            {item.quantity} <span className="text-[7px] uppercase opacity-40 font-bold ml-0.5">{item.unit || 'Qty'}</span>
                          </td>
                          <td className="py-3 text-center border-r border-[#081621] font-black text-gray-700">{item.price?.toLocaleString()}</td>
                          <td className="py-3 text-center font-black text-gray-900 bg-gray-50/20">{(item.price * item.quantity).toLocaleString()}/-</td>
                        </tr>
                      ))}
                      
                      <tr className="border-t border-[#081621] bg-gray-50/80">
                        <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] border-r border-[#081621]">Gross Amount</td>
                        <td className="py-2 px-4 text-center font-black text-xs">৳{invoice.subtotal.toLocaleString()}</td>
                      </tr>

                      {invoice.discount > 0 && (
                        <tr className="border-t border-[#081621] bg-white">
                          <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] border-r border-[#081621] text-rose-600">Discount (-)</td>
                          <td className="py-2 px-4 text-center font-black text-xs text-rose-600">৳{invoice.discount.toLocaleString()}</td>
                        </tr>
                      )}

                      {invoice.tax > 0 && (
                        <tr className="border-t border-[#081621] bg-white">
                          <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] border-r border-[#081621]">VAT ({invoice.vatPercent || 0}%) (+)</td>
                          <td className="py-2 px-4 text-center font-black text-xs">৳{invoice.tax.toLocaleString()}</td>
                        </tr>
                      )}

                      <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                        <td colSpan={4} className="py-4 px-8 text-right font-black uppercase text-xs tracking-widest border-r border-white/10 italic">
                          Final Amount Payable
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-xl font-black tracking-tight leading-none whitespace-nowrap">৳{invoice.total.toLocaleString()}</span>
                        </td>
                      </tr>

                      <tr className="border-t border-[#081621] bg-emerald-50/50">
                        <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] border-r border-[#081621] text-emerald-700 italic">Total Received Amount</td>
                        <td className="py-2 px-4 text-center font-black text-xs text-emerald-700">৳{invoice.paidAmount?.toLocaleString() || 0}</td>
                      </tr>

                      <tr className="border-t border-[#081621] bg-rose-50/50">
                        <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] border-r border-[#081621] text-rose-700 italic">Net Due Balance</td>
                        <td className="py-2 px-4 text-center font-black text-sm text-rose-600">৳{invoice.dueAmount?.toLocaleString() || 0}</td>
                      </tr>
                    </tbody>
                  </table>
               </div>

               <div className="p-4 bg-[#1E5F7A]/5 rounded-2xl border border-[#081621] flex flex-col gap-0.5 text-left">
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">In Words:</p>
                  <p className="text-xs font-black text-[#081621] italic">"{numberToWords(invoice.total)}"</p>
               </div>
            </div>

            {/* 🖋️ SIGNATURES (MOVED ABOVE SERVICES) */}
            <div className="px-12 py-10 grid grid-cols-2 gap-24 items-end shrink-0" style={{ pageBreakInside: 'avoid' }}>
                <div className="text-center space-y-4">
                   <div className="border-b border-gray-300 h-10 flex items-center justify-center"></div>
                   <p className="text-[10px] font-black uppercase text-[#081621] tracking-tighter">Customer Signature</p>
                </div>

                <div className="flex flex-col items-center justify-end text-center space-y-4">
                   <div className="h-12 w-28 relative border-b border-gray-100 pb-1 flex items-center justify-center">
                        {signatureUrl ? (
                          <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized />
                        ) : (
                          <div className="text-[7px] font-black text-gray-200 border border-dashed p-2 uppercase">Auth. Signature</div>
                        )}
                   </div>
                   <div>
                      <p className="font-black text-[10px] uppercase text-[#081621] tracking-tighter">Authorized Signatory</p>
                      <p className="text-[7px] font-bold text-primary uppercase tracking-widest">Smart Clean Bangladesh</p>
                   </div>
                </div>
            </div>

            {/* 🛡️ SERVICES WE PROVIDE (MOVED BELOW SIGNATURES) */}
            <div className="px-12 pt-8 pb-6 border-t border-gray-100 bg-gray-50/30" style={{ pageBreakInside: 'avoid' }}>
              <p className="text-[9px] font-black uppercase text-[#1E5F7A] tracking-[0.2em] mb-4 text-left">Services We Provide</p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {providedServicesList.map((service, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="p-0.5 bg-primary/10 rounded-sm"><Check size={8} className="text-primary" strokeWidth={4} /></div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight truncate">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 text-center space-y-2 mb-4">
              <p className="text-sm font-black text-primary flex items-center justify-center gap-2">
                <Heart size={16} fill="currentColor" /> Thank you for your business!
              </p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">We look forward to serving you again.</p>
            </div>

            <div className="pb-4 w-full text-center shrink-0">
               <p className="text-[7px] text-gray-300 uppercase font-bold">{footerDisclaimer}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Wallet size={18} /> Settlements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                  <p className="text-xs font-black uppercase">Outstanding Due</p>
                  <span className="text-xl font-black text-rose-400">৳{invoice.dueAmount?.toLocaleString()}</span>
               </div>
               <div className="grid grid-cols-1 gap-3">
                  <Button size="sm" onClick={() => updateDoc(invoiceRef!, { paymentStatus: 'Paid', dueAmount: 0, paidAmount: invoice.total })} className="bg-emerald-600 hover:bg-emerald-700 font-black h-11 rounded-xl uppercase text-[10px]">Mark as Fully Settled</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
