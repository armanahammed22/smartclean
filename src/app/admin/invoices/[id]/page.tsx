'use client';

import React, { useState, useEffect } from 'react';
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
  History,
  FileText,
  Info,
  Layers,
  Palette,
  CheckCircle2,
  Printer
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
  const [template, setTemplate] = useState<'classic' | 'modern'>('classic');

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const handleUpdateStatus = async (status: string) => {
    if (!invoiceRef || !invoice) return;
    try {
      await updateDoc(invoiceRef, { 
        paymentStatus: status,
        paidAmount: status === 'Paid' ? invoice.total : 0,
        dueAmount: status === 'Paid' ? 0 : invoice.total,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Settlement Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;
  if (!invoice) return <div className="p-20 text-center uppercase font-black opacity-20">Document Not Found</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

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
          <div className="bg-white border rounded-xl p-1 flex">
            <Button variant="ghost" size="sm" onClick={() => setTemplate('classic')} className={cn("text-[9px] font-black uppercase rounded-lg px-4 h-8", template === 'classic' ? "bg-primary text-white" : "text-gray-400")}>Classic</Button>
            <Button variant="ghost" size="sm" onClick={() => setTemplate('modern')} className={cn("text-[9px] font-black uppercase rounded-lg px-4 h-8", template === 'modern' ? "bg-primary text-white" : "text-gray-400")}>Modern</Button>
          </div>
          <Button variant="outline" className="gap-2 font-bold h-11 px-6 rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50" asChild>
            <a href={`https://wa.me/${invoice.customerInfo.phone?.replace(/\D/g, '')}`} target="_blank"><MessageCircle size={18} /> Send to WhatsApp</a>
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
            className={cn("bg-white shadow-2xl relative mx-auto", template === 'classic' ? "border-t-[15px] border-[#1E5F7A]" : "border-t-[10px] border-[#081621]")}
            style={{ width: '210mm', minHeight: '297mm', color: '#333' }}
          >
            {/* Header */}
            <div className="relative pt-10 px-12">
               <div className="flex items-start justify-between mb-12">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 relative bg-white rounded-2xl p-1 shadow-sm border border-gray-50">
                       <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                    </div>
                    <div className="pt-2">
                      <h2 className="text-3xl font-black text-[#1E5F7A] tracking-tighter italic leading-none">{settings?.websiteName || 'Smart Clean'}</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Smart Solutions, Spotless Life.</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 text-[10px] font-bold text-[#1E5F7A] uppercase">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border shadow-sm"><Phone size={11}/> {settings?.contactPhone}</div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border shadow-sm"><Mail size={11}/> {settings?.contactEmail}</div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border shadow-sm"><Globe size={11}/> smartclean.com.bd</div>
                  </div>
               </div>
               <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none opacity-[0.03] z-0">
                  <svg viewBox="0 0 1440 320" className="w-full h-full"><path fill="#1E5F7A" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>
               </div>
            </div>

            <div className="px-16 space-y-10 relative z-10">
               <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-1 w-fit">Invoiced To:</p>
                    <div className="space-y-1">
                        <p className="text-xl font-black text-[#081621] uppercase leading-tight">{invoice.customerInfo.name}</p>
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-2"><Phone size={10} className="text-primary"/> {invoice.customerInfo.phone}</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[320px] flex items-start gap-2 mt-2">
                           <MapPin size={10} className="text-primary mt-1 shrink-0"/> {invoice.customerInfo.address}
                        </p>
                    </div>
                  </div>
                  <div className="text-right space-y-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-widest">Document ID</p>
                        <p className="text-lg font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-widest">Date Published</p>
                        <p className="text-sm font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                    </div>
                  </div>
               </div>

               <div className="text-center py-4 border-y-2 border-[#1E5F7A] bg-[#1E5F7A]/5 rounded-xl">
                  <h3 className="text-xl font-black uppercase text-[#1E5F7A] tracking-[0.2em]">
                    {invoice.projectId ? 'OFFICIAL SERVICE QUOTATION' : 'OFFICIAL SALES INVOICE'}
                  </h3>
               </div>

               <div className="overflow-hidden border-2 border-[#081621] rounded-2xl shadow-sm">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#00A8B5] text-white">
                      <tr>
                        <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase w-12 text-center">SL.</th>
                        <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase text-left">Description</th>
                        <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase text-center w-24">Qty/Unit</th>
                        <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase text-center w-28">Rate (৳)</th>
                        <th className="py-4 px-4 text-[10px] font-black uppercase text-center w-32">Total (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium bg-white">
                      {invoice.items.map((item: any, i: number) => (
                        <tr key={i} className="border-t border-[#081621]">
                          <td className="py-4 text-center border-r border-[#081621] font-black text-gray-400">{i + 1}</td>
                          <td className="py-4 px-4 border-r border-[#081621] font-black uppercase text-gray-800">{item.name}</td>
                          <td className="py-4 text-center border-r border-[#081621] font-black text-gray-700">{item.quantity} <span className="text-[8px] uppercase opacity-50">{item.unit || 'Qty'}</span></td>
                          <td className="py-4 text-center border-r border-[#081621] font-black text-gray-700">{item.price?.toLocaleString()}</td>
                          <td className="py-4 text-center font-black text-gray-900 bg-gray-50/20">{(item.price * item.quantity).toLocaleString()}/-</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-[#081621] bg-gray-50/80">
                        <td colSpan={4} className="py-3 px-6 text-right font-black uppercase text-[10px] border-r border-[#081621]">Gross Amount</td>
                        <td className="py-3 px-4 text-center font-black text-sm">৳{invoice.subtotal.toLocaleString()}</td>
                      </tr>
                      {invoice.discount > 0 && (
                        <tr className="border-t border-[#081621] bg-white">
                          <td colSpan={4} className="py-3 px-6 text-right font-black uppercase text-[10px] border-r border-[#081621] text-rose-600">Promo Savings (-)</td>
                          <td className="py-3 px-4 text-center font-black text-sm text-rose-600">৳{invoice.discount.toLocaleString()}</td>
                        </tr>
                      )}
                      {invoice.deliveryCharge > 0 && (
                        <tr className="border-t border-[#081621] bg-white">
                          <td colSpan={4} className="py-3 px-6 text-right font-black uppercase text-[10px] border-r border-[#081621]">Logistics / Extra (+)</td>
                          <td className="py-3 px-4 text-center font-black text-sm">৳{invoice.deliveryCharge.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                        <td colSpan={4} className="py-5 px-6 text-right font-black uppercase text-[14px] border-r border-white/20 tracking-widest italic">Final Amount Payable</td>
                        <td className="py-5 px-4 text-center font-black text-2xl tracking-tighter shadow-lg">৳{invoice.total.toLocaleString()} /-</td>
                      </tr>
                    </tbody>
                  </table>
               </div>

               <div className="p-6 bg-[#1E5F7A]/5 rounded-2xl border-2 border-[#081621] flex flex-col gap-1">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Total Amount In Words:</p>
                  <p className="text-sm font-black text-[#081621] italic">" {numberToWords(invoice.total)} "</p>
               </div>

               <div className="grid grid-cols-2 gap-12 pt-4 items-start">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <Info size={16} className="text-[#1E5F7A] shrink-0 mt-0.5" />
                      <p className="text-[9px] font-bold text-blue-900 leading-normal uppercase">
                          Payment should be cleared at site upon completion. For any billing query, call +8801919640422. This is a computer generated document.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-end text-center space-y-5 pb-4">
                     <div className="h-16 w-32 relative border-b-2 border-gray-100 pb-2 flex items-center justify-center">
                        {signatureUrl ? (
                          <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized />
                        ) : (
                          <div className="text-[8px] font-black text-gray-200 border border-dashed p-3 uppercase tracking-tighter">Auth. Signature</div>
                        )}
                     </div>
                     <div>
                        <p className="font-black text-xs uppercase text-[#081621] tracking-tighter">Chief Operational Officer</p>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Smart Clean Bangladesh</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-20 border-t-4 border-[#1E5F7A] px-12 flex items-center justify-between bg-white">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary text-white rounded-xl shadow-lg"><MapPin size={16} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-800 uppercase leading-none mb-1">Corporate Hub</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">{settings?.address || 'Mohakhali, Dhaka'}</p>
                  </div>
               </div>
               <p className="text-[11px] font-black text-[#1E5F7A] uppercase tracking-[0.3em] italic opacity-40">Verified Business Entity</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Wallet size={18} /> Payout Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Settlement Status</p>
                   <Badge className={cn(
                    "text-[10px] font-black uppercase border-none px-3 h-7 rounded-lg shadow-inner",
                    invoice.paymentStatus === 'Paid' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                   )}>{invoice.paymentStatus}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button size="sm" onClick={() => handleUpdateStatus('Paid')} className="bg-emerald-600 hover:bg-emerald-700 font-black h-11 rounded-xl uppercase text-[10px]">
                    <CheckCircle2 size={14} className="mr-1.5"/> Confirm Paid
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('Unpaid')} className="bg-white/5 border-white/10 text-white font-black h-11 rounded-xl uppercase text-[10px]">
                    Reset Unpaid
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
