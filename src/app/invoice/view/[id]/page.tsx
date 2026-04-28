'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Download, 
  Loader2, 
  MapPin, 
  Phone, 
  Globe,
  Mail,
  ShieldCheck,
  Info,
  Printer,
  Wallet,
  Heart,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadInvoicePDF, numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

export default function PublicInvoiceViewPage() {
  const { id } = useParams();
  const db = useFirestore();
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

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Secure Document Not Found</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.invoiceHeaderEmail || settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  
  const websiteName = settings?.websiteName || 'Smart Clean';
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || 'This is a computer generated document and does not require a physical stamp.';

  const isDue = (invoice.dueAmount || 0) > 0;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16 selection:bg-primary selection:text-white">
      <div className="container mx-auto px-4 flex flex-col items-center">
        
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 px-4 text-center sm:text-left">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-[#081621] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border border-white/10">SC</div>
            <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#081621] block">Secure Billing Portal</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1">Verified Document</Badge>
            </div>
          </div>
          <Button 
            className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-10 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
            onClick={() => { setIsDownloading(true); downloadInvoicePDF('public-invoice-render', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={16} />} DOWNLOAD PDF
          </Button>
        </div>

        <div 
          id="public-invoice-render" 
          className="bg-white shadow-2xl relative border-t-[10px] border-[#1E5F7A]"
          style={{ width: '210mm', minHeight: '297mm', color: '#333', display: 'flex', flexDirection: 'column' }}
        >
          {/* 🖼️ CORPORATE HEADER */}
          <div className="pt-8 px-12 pb-4 flex justify-between items-start border-b-2 border-gray-100 shrink-0">
             <div className="flex gap-4">
               <div className="w-16 h-16 relative shrink-0">
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
               </div>
               <div className="space-y-1 text-left">
                  <h2 className="text-2xl font-black text-[#081621] tracking-tighter uppercase leading-none">{websiteName}</h2>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Better Security, Better Solution</p>
                  <div className="h-0.5 bg-primary w-full mt-1.5" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest pt-1">Corporate Branch</p>
               </div>
             </div>

             <div className="h-16 w-px bg-gray-300 mx-6" />

             <div className="flex-1 text-left space-y-0.5">
                <p className="text-[8.5px] font-bold text-gray-600 leading-normal uppercase">{headerAddress}</p>
                <p className="text-[8.5px] font-bold text-gray-600 uppercase">Mobile: {headerPhone}</p>
                <p className="text-[8.5px] font-bold text-gray-600 uppercase">E-mail: {headerEmail}</p>
                <p className="text-[8.5px] font-bold text-gray-600 uppercase">Web: smartclean.com.bd</p>
             </div>
          </div>

          <div className="px-12 pt-4 space-y-4 flex-1 relative z-10">
             <div className="text-center space-y-0.5">
                <h3 className="text-xl font-black uppercase text-[#081621] tracking-tighter underline underline-offset-4 decoration-primary/30">Invoice / Bill</h3>
                <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isDue ? "text-rose-600" : "text-emerald-600")}>
                  ({isDue ? 'DUE' : 'PAID'})
                </p>
             </div>

             <div className="flex justify-between items-start">
                <div className="space-y-2 text-left">
                  <p className="text-[8.5px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5 w-fit">Invoiced To:</p>
                  <div className="space-y-0.5">
                    <p className="text-base font-black text-[#081621] uppercase leading-tight">{invoice.customerInfo.name}</p>
                    <p className="text-[10px] font-bold text-gray-700">{invoice.customerInfo.phone}</p>
                    <p className="text-[9px] text-gray-500 font-medium leading-normal max-w-[320px] mt-1">{invoice.customerInfo.address}</p>
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div className="space-y-0.5">
                    <p className="text-[8.5px] font-black text-[#1E5F7A] uppercase tracking-widest">Reference ID</p>
                    <p className="text-sm font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8.5px] font-black text-[#1E5F7A] uppercase tracking-widest">Date Published</p>
                    <p className="text-xs font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                  </div>
                </div>
             </div>

             <div className="overflow-hidden border border-[#081621] rounded-2xl shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-[#1E5F7A] text-white">
                    <tr>
                      <th className="py-2 px-4 text-[8.5px] font-black border-r border-[#081621] uppercase w-12 text-center">SL.</th>
                      <th className="py-2 px-4 text-[8.5px] font-black border-r border-[#081621] uppercase text-left">Description</th>
                      <th className="py-2 px-4 text-[8.5px] font-black border-r border-[#081621] uppercase text-center w-20">Qty</th>
                      <th className="py-2 px-4 text-[8.5px] font-black border-r border-[#081621] uppercase text-right w-24">Rate (৳)</th>
                      <th className="py-2 px-4 text-[8.5px] font-black uppercase text-right w-28">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] font-medium bg-white">
                    {invoice.items.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-[#081621]">
                        <td className="py-2.5 text-center border-r border-[#081621] font-black text-gray-400">{i + 1}</td>
                        <td className="py-2.5 px-4 border-r border-[#081621] font-black uppercase text-gray-800 text-left">{item.name}</td>
                        <td className="py-2.5 text-center border-r border-[#081621] font-black text-gray-700">
                           {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-4 border-r border-[#081621] font-black text-gray-700 text-right">৳{item.price?.toLocaleString()}/-</td>
                        <td className="py-2.5 px-4 text-right font-black text-gray-900 bg-gray-50/20">৳{(item.price * item.quantity).toLocaleString()}/-</td>
                      </tr>
                    ))}
                    
                    <tr className="border-t border-[#081621] bg-gray-50/80">
                      <td colSpan={4} className="py-1.5 px-6 text-right font-black uppercase text-[8.5px] border-r border-[#081621]">Gross Amount</td>
                      <td className="py-1.5 px-4 text-right font-black text-xs">৳{invoice.subtotal.toLocaleString()}/-</td>
                    </tr>

                    {invoice.discount > 0 && (
                      <tr className="border-t border-[#081621] bg-white">
                        <td colSpan={4} className="py-1.5 px-6 text-right font-black uppercase text-[8.5px] border-r border-[#081621] text-rose-600">Savings/Promo (-)</td>
                        <td className="py-1.5 px-4 text-right font-black text-xs text-rose-600">৳{invoice.discount.toLocaleString()}/-</td>
                      </tr>
                    )}

                    {invoice.tax > 0 && (
                      <tr className="border-t border-[#081621] bg-white">
                        <td colSpan={4} className="py-1.5 px-6 text-right font-black uppercase text-[8.5px] border-r border-[#081621]">VAT ({invoice.vatPercent || 0}%) (+)</td>
                        <td className="py-1.5 px-4 text-right font-black text-xs">৳{invoice.tax.toLocaleString()}/-</td>
                      </tr>
                    )}

                    <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                      <td colSpan={4} className="py-2.5 px-8 text-right font-black uppercase text-[9px] tracking-widest border-r border-white/10 italic">
                        Final Amount Payable
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-base font-black tracking-tight leading-none whitespace-nowrap">৳{invoice.total.toLocaleString()}/-</span>
                      </td>
                    </tr>

                    <tr className="border-t border-[#081621] bg-emerald-50/50">
                      <td colSpan={4} className="py-1.5 px-6 text-right font-black uppercase text-[8.5px] border-r border-[#081621] text-emerald-700 italic">Total Paid Amount</td>
                      <td className="py-1.5 px-4 text-right font-black text-xs text-emerald-700">৳{invoice.paidAmount?.toLocaleString() || 0}/-</td>
                    </tr>

                    <tr className="border-t border-[#081621] bg-rose-50/50">
                      <td colSpan={4} className="py-1.5 px-6 text-right font-black uppercase text-[8.5px] border-r border-[#081621] text-rose-700 italic">Net Due Balance</td>
                      <td className="py-1.5 px-4 text-right font-black text-sm text-rose-600">৳{invoice.dueAmount?.toLocaleString() || 0}/-</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             <div className="p-3 bg-[#1E5F7A]/5 rounded-xl border border-[#081621] space-y-0.5 text-left">
                <p className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Amount in words:</p>
                <p className="text-[11px] font-black text-[#081621] italic">"{numberToWords(invoice.total)}"</p>
             </div>
          </div>

          {/* 🖋️ SIGNATURES */}
          <div className="px-12 py-6 grid grid-cols-2 gap-24 items-end shrink-0" style={{ pageBreakInside: 'avoid' }}>
                <div className="text-center space-y-4">
                   <div className="border-b border-gray-300 h-8"></div>
                   <p className="text-[9px] font-black uppercase text-[#081621] tracking-tighter">Customer Signature</p>
                </div>

                <div className="flex flex-col items-center justify-end text-center space-y-3">
                   <div className="h-10 w-24 relative border-b border-gray-100 pb-1 flex items-center justify-center">
                        {signatureUrl ? (
                          <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized />
                        ) : (
                          <div className="text-[7px] font-black text-gray-200 border border-dashed p-1 uppercase">Authorized</div>
                        )}
                   </div>
                   <div>
                      <p className="font-black text-[9px] uppercase text-[#081621] tracking-tighter">Authorized Signatory</p>
                      <p className="text-[7px] font-bold text-primary uppercase tracking-widest">Smart Clean Bangladesh</p>
                   </div>
                </div>
          </div>

          {/* 🛡️ SERVICES WE PROVIDE (Below Signatures) */}
          <div className="px-12 pt-3 pb-3 border-t border-gray-100 bg-gray-50/30 shrink-0" style={{ pageBreakInside: 'avoid' }}>
            <p className="text-[8.5px] font-black uppercase text-[#1E5F7A] tracking-[0.2em] mb-2 text-left">Services We Provide</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {providedServicesList.map((service, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="p-0.5 bg-primary/10 rounded-sm"><Check size={6} className="text-primary" strokeWidth={4} /></div>
                  <span className="text-[7.5px] font-bold text-gray-500 uppercase tracking-tight truncate">{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center space-y-1 mb-2 shrink-0" style={{ pageBreakInside: 'avoid' }}>
            <p className="text-xs font-black text-primary flex items-center justify-center gap-1.5">
              <Heart size={14} fill="currentColor" /> Thank you for your business!
            </p>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">We look forward to serving you again.</p>
          </div>

          <div className="pb-3 w-full text-center shrink-0">
             <p className="text-[7px] text-gray-300 uppercase font-bold">{footerDisclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
