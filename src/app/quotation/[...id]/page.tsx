
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Download, 
  Loader2, 
  MapPin, 
  Globe,
  ShieldCheck,
  Printer,
  MessageCircle,
  Star,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadQuotationPDF } from '@/lib/quotation-utils';
import { numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

/**
 * Optimized Public Quotation View
 * Restored Font Sizes and Bottom Layout while keeping Top Gaps minimal.
 */
function QuotationViewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [quoteSettings, setQuoteSettings] = useState<any>(null);

  const quoteIdFromUrl = useMemo(() => {
    if (params.id && Array.isArray(params.id)) {
      return params.id.join('/');
    }
    return params.id as string;
  }, [params.id]);

  const isAutoDownload = searchParams.get('download') === 'true';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchQuote() {
      if (!db || !quoteIdFromUrl) return;
      setIsLoading(true);
      try {
        const docRef = collection(db, 'quotations');
        const qByNum = query(docRef, where('quoteNumber', '==', quoteIdFromUrl), limit(1));
        const snapByNum = await getDocs(qByNum);

        if (!snapByNum.empty) {
          setQuote({ ...snapByNum.docs[0].data(), id: snapByNum.docs[0].id });
          setIsLoading(false);
          return;
        }

        const qById = query(docRef, where('__name__', '==', quoteIdFromUrl), limit(1));
        const snapById = await getDocs(qById);

        if (!snapById.empty) {
          const data = snapById.docs[0].data();
          if (data.quoteNumber) {
            router.replace(`/quotation/${data.quoteNumber}`);
            return;
          }
          setQuote({ ...data, id: snapById.docs[0].id });
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuote();
  }, [db, quoteIdFromUrl, router]);

  useEffect(() => {
    if (db) {
      getDocs(query(collection(db, 'site_settings'), where('__name__', '==', 'global'), limit(1))).then(snap => {
        if (!snap.empty) setSettings(snap.docs[0].data());
      });
      getDocs(query(collection(db, 'site_settings'), where('__name__', '==', 'quotation'), limit(1))).then(snap => {
        if (!snap.empty) setQuoteSettings(snap.docs[0].data());
      });
    }
  }, [db]);

  useEffect(() => {
    if (quote && isAutoDownload && !isDownloading) {
      const timer = setTimeout(() => {
        setIsDownloading(true);
        downloadQuotationPDF('quote-render-area', quote.quoteNumber).finally(() => setIsDownloading(false));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [quote, isAutoDownload, isDownloading]);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";
  const signatureUrl = quoteSettings?.signatureUrl || settings?.signatureUrl;
  const websiteName = settings?.websiteName || 'Smart Clean';

  const providedServices = useMemo(() => {
    const list = quote?.footerServices || quoteSettings?.defaultFooterServices || settings?.invoiceProvidedServices || 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control';
    return list.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }, [settings, quote, quoteSettings]);

  const terms = useMemo(() => {
    const currentTerms = quote?.terms || quoteSettings?.defaultTerms;
    if (!currentTerms) return ["Standard service terms apply."];
    return Array.isArray(currentTerms) ? currentTerms : [currentTerms];
  }, [quote, quoteSettings]);

  const tagline = quote?.tagline || quoteSettings?.tagline || "Smart Cleaning, Better Living.";
  const footerDisclaimer = quoteSettings?.footerDisclaimer || "This document is electronically verified and ready for activation.";

  const handleWhatsApp = () => {
    if (!quote) return;
    const text = `আসসালামু আলাইকুম, স্মার্ট ক্লিন থেকে আপনার কোটিশনটি (${quote.quoteNumber}) পাঠানো হলো। এখানে দেখুন: ${window.location.href}`;
    window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-primary mx-auto" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Quotation...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-4 md:py-8 pb-32 md:pb-16 selection:bg-primary selection:text-white">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #quote-render-area { shadow: none !important; border-top: none !important; border-radius: 0 !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 px-4 no-print">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-[#081621] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl border border-white/10">SC</div>
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#081621] block">Secure Service Portal</span>
                <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5 mt-0.5">Official Quotation</Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={handleWhatsApp} className="rounded-lg gap-2 font-black uppercase text-[9px] h-9 px-4 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all"><MessageCircle size={16} /> WhatsApp</Button>
            <Button className="rounded-lg gap-2 font-black uppercase text-[9px] h-9 px-6 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => { setIsDownloading(true); downloadQuotationPDF('quote-render-area', quote.quoteNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} DOWNLOAD PDF
            </Button>
          </div>
        </div>

        <div id="quote-render-area" className="bg-white shadow-2xl relative border-t-[10px] border-[#1E5F7A] rounded-b-[1.5rem]" style={{ width: '210mm', minHeight: '297mm', color: '#333' }}>
          
          <header className="pt-6 px-12 pb-3 flex justify-between items-start border-b-2 border-gray-50 mb-4">
            <div className="flex gap-5">
              <div className="w-14 h-14 relative shrink-0"><Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized /></div>
              <div className="space-y-0.5 text-left">
                <h2 className="text-2xl font-black text-[#081621] tracking-tighter uppercase leading-none">{websiteName}</h2>
                <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Professional Excellence</p>
              </div>
            </div>
            <div className="text-right max-w-[280px]">
              <p className="text-[9px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
              <p className="text-[9px] font-bold text-[#081621] uppercase mt-1">Cell: <span className="font-black">{headerPhone}</span></p>
            </div>
          </header>

          <div className="px-12 pb-6 space-y-6">
            <div className="text-center space-y-1">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-[#081621]">Service Quotation</h3>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
            </div>

            <div className="flex justify-between items-start">
              <div className="text-left space-y-4">
                <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5 w-fit">Recipient Profile</p>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-[#081621] uppercase tracking-tight leading-none">{quote.customerInfo?.name}</h4>
                  <p className="text-[11px] font-bold text-gray-600">{quote.customerInfo?.phone}</p>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-[400px] uppercase italic">{quote.customerInfo?.address}</p>
                </div>
              </div>
              <div className="text-right space-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Ref.</p>
                  <p className="text-base font-black text-[#081621] font-mono tracking-tighter">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Issued On</p>
                  <p className="text-[11px] font-black text-[#081621]">{quote.issueDate ? format(new Date(quote.issueDate), 'dd MMM yyyy') : 'N/A'}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4">Valid Until</p>
                  <p className="text-[11px] font-black text-rose-600">{quote.expiryDate ? format(new Date(quote.expiryDate), 'dd MMM yyyy') : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden border-2 border-[#081621] rounded-2xl shadow-sm">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-[#081621] text-white">
                  <tr>
                    <th className="py-3 px-4 font-black uppercase text-left w-12">SL</th>
                    <th className="py-3 px-4 font-black uppercase text-left">Service Components</th>
                    <th className="py-3 px-4 font-black uppercase text-center w-28">Unit/Area</th>
                    <th className="py-3 px-4 font-black uppercase text-right w-28">Unit Price</th>
                    <th className="py-3 px-4 font-black uppercase text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="font-bold bg-white">
                  {quote.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-t-2 border-gray-50 align-top">
                      <td className="py-2 px-4 text-left text-gray-400">{i + 1}</td>
                      <td className="py-2 px-4 text-left">
                        <p className="font-black text-gray-900 uppercase leading-tight mb-0.5">{item.name}</p>
                        {item.description && <p className="text-[9px] text-gray-500 font-medium leading-tight italic">{item.description}</p>}
                      </td>
                      <td className="py-2 px-4 text-center text-gray-600 uppercase font-black">{item.quantity} {item.unit || 'Qty'}</td>
                      <td className="py-2 px-4 text-right text-gray-600">৳{item.price?.toLocaleString()}</td>
                      <td className="py-2 px-4 text-right text-[#081621] font-black">৳{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="border-t-[3px] border-[#081621] bg-gray-50/50">
                    <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[10px] tracking-widest">Base Estimate Total</td>
                    <td className="py-3 px-4 text-right font-black text-sm">৳{quote.subtotal?.toLocaleString()}/-</td>
                  </tr>
                  <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                    <td colSpan={4} className="py-4 px-8 text-right font-black uppercase text-[11px] tracking-[0.2em] italic">Net Proposed Amount</td>
                    <td className="py-4 px-4 text-right font-black text-lg">৳{quote.total?.toLocaleString()}/-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col gap-1 text-left">
              <p className="text-[7px] font-black uppercase text-gray-400 tracking-[0.3em]">Value Proof (In words):</p>
              <p className="text-[11px] font-black text-[#081621] italic">"{numberToWords(parseFloat(quote.total) || 0)}"</p>
            </div>

            <div className="space-y-3">
               <h5 className="text-[11px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-1 w-fit">General Terms & Conditions</h5>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-inner">
                  <div className="space-y-2">
                    {terms.map((term: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-[11px] font-black text-primary min-w-[20px]">{i + 1}.</span>
                        <p className="text-[10px] md:text-[11px] font-medium text-gray-600 leading-relaxed">{term}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="avoid-break grid grid-cols-2 gap-32 items-end pt-10 pb-10">
              <div className="text-center space-y-4">
                <div className="border-b-[3px] border-gray-100 h-10"></div>
                <p className="text-[10px] font-black uppercase text-[#081621]">Client Signature</p>
              </div>
              <div className="flex flex-col items-center justify-end text-center space-y-4">
                <div className="h-16 w-32 relative border-b-[3px] border-primary/10 flex items-center justify-center">
                   {signatureUrl ? <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized /> : <Badge variant="outline" className="text-[8px] font-black border-dashed border-primary/30 text-primary uppercase">Authorized Digitally</Badge>}
                </div>
                <p className="font-black text-[10px] uppercase text-[#081621]">Smart Clean Authority</p>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-gray-100">
               <div className="text-center space-y-2 mb-6">
                  <p className="text-[12px] font-black text-primary flex items-center justify-center gap-2 uppercase tracking-widest">{tagline} <Star size={10} fill="currentColor"/></p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em]">Our Professional Service Network</p>
               </div>
               
               <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                  {Array.from({ length: 3 }).map((_, colIdx) => (
                    <div key={colIdx} className="space-y-2">
                       {providedServices.filter((_: string, i: number) => i % 3 === colIdx).map((service: string, sIdx: number) => (
                         <div key={sIdx} className="flex items-center gap-2">
                            <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase truncate">{service}</span>
                         </div>
                       ))}
                    </div>
                  ))}
               </div>

               <p className="text-[8px] text-gray-300 font-bold uppercase text-center mt-10 tracking-[0.4em]">{footerDisclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicQuotationViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <QuotationViewContent />
    </Suspense>
  )
}
