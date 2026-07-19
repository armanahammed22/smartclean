
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
  Check,
  X,
  Zap,
  Calendar,
  Layers,
  Award,
  Star,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadQuotationPDF } from '@/lib/quotation-utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { numberToWords } from '@/lib/invoice-utils';

export default function PublicQuotationViewPage() {
  const { id } = useParams();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quoteRef = useMemoFirebase(() => (db && id) ? doc(db, 'quotations', id as string) : null, [db, id]);
  const { data: quote, isLoading } = useDoc(quoteRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const headerPhone = settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (!db || !id) return;
    setIsActionLoading(true);
    try {
      await updateDoc(doc(db, 'quotations', id as string), { status, updatedAt: new Date().toISOString() });
      toast({ title: `Quotation ${status}`, description: "The sales team has been notified." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!quote) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Quotation Document Not Found</div>;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16 selection:bg-primary selection:text-white pb-32 md:pb-16">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 flex flex-col items-center">
        
        {/* ACTION BAR */}
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 px-4 no-print">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-[#081621] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border border-white/10">SC</div>
            <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#081621] block">Secure Service Portal</span>
                <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1">Official Quotation</Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {quote.status === 'Sent' && (
              <>
                <Button onClick={() => handleAction('Approved')} disabled={isActionLoading} className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20">
                  <CheckCircle2 size={18} /> Accept Quote
                </Button>
                <Button variant="outline" onClick={() => handleAction('Rejected')} disabled={isActionLoading} className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-8 border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100">
                  <X size={18} /> Reject
                </Button>
              </>
            )}
            <Button className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-10 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => { setIsDownloading(true); downloadQuotationPDF('quote-render-area', quote.quoteNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={16} />} DOWNLOAD PDF
            </Button>
          </div>
        </div>

        {/* 📄 DOCUMENT RENDER AREA */}
        <div id="quote-render-area" className="bg-white shadow-2xl relative border-t-[14px] border-[#1E5F7A] rounded-b-[2rem]" style={{ width: '210mm', minHeight: '297mm', color: '#333' }}>
          
          <header className="pt-10 px-12 pb-6 flex justify-between items-start border-b-[3px] border-gray-50 mb-10">
            <div className="flex gap-6">
              <div className="w-16 h-16 relative shrink-0"><Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized /></div>
              <div className="space-y-1 text-left">
                <h2 className="text-2xl font-black text-[#081621] tracking-tighter uppercase leading-none">{settings?.websiteName || 'Smart Clean'}</h2>
                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">Excellence in Sanitization</p>
              </div>
            </div>
            <div className="text-right max-w-[280px]">
              <p className="text-[9px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
              <p className="text-[9px] font-bold text-[#081621] uppercase mt-1">Cell: <span className="font-black">{headerPhone}</span></p>
              <p className="text-[9px] font-bold text-[#081621] lowercase">{headerEmail}</p>
            </div>
          </header>

          <div className="px-12 pb-10 space-y-10">
            <div className="text-center space-y-1">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-[#081621]">Service Quotation</h3>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
            </div>

            <div className="flex justify-between items-start">
              <div className="text-left space-y-4">
                <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-[0.3em] mb-2 border-b border-primary/20 pb-1 w-fit">Recipient Profile</p>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-[#081621] uppercase tracking-tight">{quote.customerInfo.name}</h4>
                  {quote.customerInfo.company && <p className="text-[11px] font-black text-primary uppercase">{quote.customerInfo.company}</p>}
                  <p className="text-[10px] font-bold text-gray-600">{quote.customerInfo.phone}</p>
                  <p className="text-[9px] text-gray-500 font-medium leading-relaxed max-w-[350px] uppercase italic">{quote.customerInfo.address}</p>
                </div>
              </div>
              <div className="text-right space-y-6">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Document Ref.</p>
                  <p className="text-base font-black text-[#081621] font-mono tracking-tighter">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Issued On</p>
                  <p className="text-[11px] font-black text-[#081621]">{format(new Date(quote.issueDate), 'dd MMMM yyyy')}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4">Valid Until</p>
                  <p className="text-[11px] font-black text-rose-600">{format(new Date(quote.expiryDate), 'dd MMMM yyyy')}</p>
                </div>
              </div>
            </div>

            {/* MAIN ITEMS TABLE */}
            <div className="overflow-hidden border-2 border-[#081621] rounded-2xl shadow-sm">
              <table className="w-full border-collapse text-[10px]">
                <thead className="bg-[#081621] text-white">
                  <tr>
                    <th className="py-3 px-4 font-black uppercase text-left w-12">SL</th>
                    <th className="py-3 px-4 font-black uppercase text-left">Service Components</th>
                    <th className="py-3 px-4 font-black uppercase text-center w-28">Quantity</th>
                    <th className="py-3 px-4 font-black uppercase text-right w-28">Unit Price</th>
                    <th className="py-3 px-4 font-black uppercase text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="font-bold bg-white">
                  {quote.items.map((item: any, i: number) => (
                    <tr key={i} className="border-t-2 border-gray-50 align-top">
                      <td className="py-4 px-4 text-left text-gray-400">{i + 1}</td>
                      <td className="py-4 px-4 text-left">
                        <p className="font-black text-gray-900 uppercase leading-tight mb-1">{item.name}</p>
                        <p className="text-[9px] text-gray-500 font-medium leading-relaxed italic">{item.description}</p>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600 uppercase font-black">{item.quantity} {item.unit}</td>
                      <td className="py-4 px-4 text-right text-gray-600">৳{item.price.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-[#081621] font-black">৳{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                  
                  {/* OPTIONAL ADD-ONS */}
                  {quote.addOns?.length > 0 && (
                    <>
                      <tr className="bg-primary/5"><td colSpan={5} className="py-2 px-4 text-[8px] font-black uppercase text-primary tracking-widest text-center border-t-2 border-gray-100">Optional Service Enhancements</td></tr>
                      {quote.addOns.map((add: any, i: number) => (
                        <tr key={i} className="border-t border-gray-50">
                           <td className="py-2 px-4"></td>
                           <td className="py-2 px-4 text-[9px] font-bold text-gray-600 uppercase">{add.name}</td>
                           <td className="py-2 px-4 text-center text-[9px]">{add.quantity} UNIT</td>
                           <td className="py-2 px-4 text-right text-[9px]">৳{add.price.toLocaleString()}</td>
                           <td className="py-2 px-4 text-right font-black text-emerald-600">৳{(add.price * add.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  <tr className="border-t-[3px] border-[#081621] bg-gray-50/50">
                    <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[9px] tracking-widest">Base Estimate Total</td>
                    <td className="py-3 px-4 text-right font-black text-xs">৳{quote.subtotal.toLocaleString()}</td>
                  </tr>

                  {quote.discount > 0 && (
                    <tr className="border-t border-gray-100 bg-white">
                      <td colSpan={4} className="py-2.5 px-8 text-right font-black uppercase text-[9px] tracking-widest text-rose-500">Discount Applied ({quote.discountType === 'percentage' ? `${quote.discount}%` : 'Flat'})</td>
                      <td className="py-2.5 px-4 text-right font-black text-xs text-rose-500">-৳{(quote.subtotal * (quote.discount/100)).toLocaleString()}</td>
                    </tr>
                  )}

                  <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                    <td colSpan={4} className="py-4 px-8 text-right font-black uppercase text-[10px] tracking-[0.2em] italic">Net Proposed Amount</td>
                    <td className="py-4 px-4 text-right font-black text-base">৳{quote.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col gap-1 text-left">
              <p className="text-[7px] font-black uppercase text-gray-400 tracking-[0.3em]">Value Proof (In words):</p>
              <p className="text-[11px] font-black text-[#081621] italic">"{numberToWords(quote.total)}"</p>
            </div>

            {/* TERMS SECTION */}
            <div className="space-y-4">
               <h5 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-1 w-fit">General Terms & Conditions</h5>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-inner">
                  <div className="text-[11px] font-medium text-gray-600 leading-loose whitespace-pre-wrap">
                    {quote.terms || "Standard service terms apply."}
                  </div>
               </div>
            </div>

            {/* SIGNATURE AREA */}
            <div className="avoid-break grid grid-cols-2 gap-32 items-end pt-12">
              <div className="text-center space-y-4">
                <div className="border-b-[3px] border-gray-100 h-10"></div>
                <p className="text-[10px] font-black uppercase text-[#081621]">Client Acceptance</p>
              </div>
              <div className="flex flex-col items-center justify-end text-center space-y-4">
                <div className="h-16 w-32 relative border-b-[3px] border-primary/10 flex items-center justify-center">
                  <Badge variant="outline" className="text-[8px] font-black border-dashed border-primary/30 text-primary uppercase">Authorized Digitally</Badge>
                </div>
                <p className="font-black text-[10px] uppercase text-[#081621]">Smart Clean Authority</p>
              </div>
            </div>

            <div className="pt-10 border-t border-gray-50 text-center space-y-1">
               <p className="text-[11px] font-black text-primary flex items-center justify-center gap-2">Better Security, Better Solution <Star size={10} fill="currentColor"/></p>
               <p className="text-[8px] text-gray-300 font-bold uppercase">This document is electronically verified and ready for activation.</p>
            </div>
          </div>
        </div>

        {/* INFO FOOTER (MOBILE ONLY) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 shadow-2xl z-[200]">
           {quote.status === 'Sent' && (
             <Button onClick={() => handleAction('Approved')} className="flex-1 h-14 rounded-2xl bg-primary font-black uppercase text-xs">Accept & Confirm</Button>
           )}
           <Button onClick={handleWhatsApp} variant="outline" className="flex-1 h-14 rounded-2xl border-emerald-200 text-emerald-700 bg-emerald-50"><MessageCircle size={20}/> Chat</Button>
        </div>

      </div>
    </div>
  );
}
