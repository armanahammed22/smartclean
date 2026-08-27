'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
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
  ArrowLeft,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadQuotationPDF } from '@/lib/quotation-utils';
import { numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

/**
 * 🛡️ ROBUST QUOTATION VIEW
 * Handles all formats: /quotation/ID or /quotation/QTN/SM/2026/1001
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

  const fullId = useMemo(() => {
    const rawId = params.id;
    if (!rawId) return '';
    const segments = Array.isArray(rawId) ? rawId : [rawId];
    return segments.map(s => decodeURIComponent(s)).join('/');
  }, [params.id]);

  const isAutoDownload = searchParams.get('download') === 'true';

  const designRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'document_design') : null, [db]);
  const { data: design } = useDoc(designRef);

  const globalRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(globalRef);

  const quoteSettingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);
  const { data: quoteSettings } = useDoc(quoteSettingsRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchQuote() {
      if (!db || !fullId) return;
      setIsLoading(true);
      try {
        const docRef = collection(db, 'quotations');
        const normalizedId = fullId.toUpperCase().trim();
        
        const qByNum = query(docRef, where('quoteNumber', '==', normalizedId), limit(1));
        const snapByNum = await getDocs(qByNum);

        if (!snapByNum.empty) {
          setQuote({ ...snapByNum.docs[0].data(), id: snapByNum.docs[0].id });
          setIsLoading(false);
          return;
        }

        const qById = doc(db, 'quotations', fullId);
        const snapById = await getDoc(qById);

        if (snapById.exists()) {
          setQuote({ ...snapById.data(), id: snapById.id });
        }
      } catch (e) {
        console.error('[Quotation Protocol Failure]:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuote();
  }, [db, fullId]);

  useEffect(() => {
    if (quote && isAutoDownload && !isDownloading) {
      const timer = setTimeout(() => {
        setIsDownloading(true);
        downloadQuotationPDF('quote-render-area', quote.quoteNumber).finally(() => setIsDownloading(false));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [quote, isAutoDownload, isDownloading]);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";
  const signatureUrl = quoteSettings?.signatureUrl || settings?.signatureUrl;
  const websiteName = settings?.websiteName || 'Smart Clean';

  const providedServices = useMemo(() => {
    const list = quote?.defaultFooterServices || quoteSettings?.defaultFooterServices || settings?.invoiceProvidedServices || 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control';
    return list.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }, [settings, quote, quoteSettings]);

  const terms = useMemo(() => {
    const currentTerms = quote?.terms || quoteSettings?.defaultTerms;
    if (!currentTerms) return ["Standard service terms apply."];
    return Array.isArray(currentTerms) ? currentTerms : [currentTerms];
  }, [quote, quoteSettings]);

  const tagline = quote?.tagline || quoteSettings?.tagline || "Smart Cleaning, Better Living.";
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || "ELECTRONICALLY VERIFIED DOCUMENT";

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  
  if (!quote) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 space-y-6 max-w-md animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
           <FileSpreadsheet size={40} />
        </div>
        <h1 className="text-xl font-black uppercase opacity-60 tracking-[0.2em]">Document Not Found</h1>
        <p className="text-sm text-gray-400 font-medium italic">Reference: "{fullId}"</p>
        <p className="text-xs text-gray-400 leading-relaxed">The link might be expired or the reference number is invalid.</p>
        <Button onClick={() => router.push('/')} className="rounded-xl px-10 h-12 w-full font-black uppercase shadow-lg shadow-primary/20">Back to Home</Button>
      </div>
    </div>
  );

  const d = design || { primaryColor: '#1E5F7A', headerPaddingTop: 5, headerPaddingBottom: 5, sectionSpacing: 10, tableFontSize: 10.5, tableRowPadding: 2, headerFontSize: 22, bodyFontSize: 11, logoSize: 52, showGridLines: true, footerMarginTop: 5, footerPaddingBottom: 5, signatureSpacing: 25, taglineFontSize: 11, disclaimerFontSize: 7.5, paidSealUrl: '', unpaidSealUrl: '', authoritySealUrl: '' };

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-4 md:py-12 pb-32 md:pb-16 selection:bg-primary selection:text-white">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 px-4 no-print">
          <div className="flex items-center gap-4 text-left">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-xl h-10 w-10 bg-white border shadow-sm"><ArrowLeft size={20}/></Button>
            <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#081621] block">Secure Service Portal</span>
                <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1">Official Quotation</Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-6 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm" style={{ backgroundColor: 'white' }}><MessageCircle size={18} /> WhatsApp Support</Button>
            <Button className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-10 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => { setIsDownloading(true); downloadQuotationPDF('quote-render-area', quote.quoteNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>{isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} DOWNLOAD PDF</Button>
          </div>
        </div>

        <div 
          id="quote-render-area" 
          className="bg-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative border-t-[14px] border-[#1E5F7A] overflow-hidden" 
          style={{ 
            width: '210mm', 
            height: '297mm', 
            maxHeight: '297mm', 
            color: '#333', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-12 flex justify-between items-start border-b-[3px] border-gray-100 shrink-0" style={{ paddingTop: `${d.headerPaddingTop}px`, paddingBottom: `${d.headerPaddingBottom}px` }}>
              <div className="flex gap-4">
                <div className="relative shrink-0" style={{ width: `${d.logoSize}px`, height: `${d.logoSize}px` }}>
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                </div>
                <div className="space-y-1 text-left flex flex-col justify-center">
                  <h2 className="font-black text-[#081621] tracking-tighter uppercase leading-none" style={{ fontSize: `${d.headerFontSize}px` }}>{websiteName}</h2>
                  <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Professional Excellence</p>
                </div>
              </div>
              <div className="text-right max-w-[280px]">
                <p className="text-[8px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
                <p className="text-[8px] font-bold text-[#081621] uppercase mt-1">Cell: <span className="font-black">{headerPhone}</span></p>
              </div>
            </header>

            <div className="px-12 py-6 space-y-4 flex-1 flex flex-col min-h-0" style={{ marginTop: `${d.sectionSpacing}px` }}>
              <div className="text-center space-y-1 shrink-0"><h3 className="text-2xl font-black uppercase tracking-tighter italic text-[#081621]">Service Quotation</h3><div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: d.primaryColor }} /></div>
              
              <div className="flex justify-between items-start shrink-0 mb-8">
                <div className="text-left space-y-3">
                  <p className="text-[9px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5 w-fit">Recipient Profile</p>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-[#081621] uppercase tracking-tight leading-none">{quote.customerInfo?.name}</h4>
                    <p className="text-[10px] font-bold text-gray-600">{quote.customerInfo?.phone}</p>
                    <p className="text-[8px] text-gray-500 font-medium leading-relaxed max-w-[400px] uppercase italic">{quote.customerInfo?.address}</p>
                  </div>
                </div>
                <div className="text-right space-y-4">
                  <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Document Ref.</p><p className="text-base font-black text-[#081621] font-mono tracking-tighter">{quote.quoteNumber}</p></div>
                  <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Issued On</p><p className="text-[10px] font-black text-[#081621]">{quote.issueDate ? format(new Date(quote.issueDate), 'dd MMM yyyy') : 'N/A'}</p></div>
                </div>
              </div>

              <div className={cn("overflow-hidden rounded-xl mb-4 shrink-0 avoid-break", d.showGridLines ? "border-2 border-[#081621]" : "border-none shadow-sm")}>
                <table className="w-full border-collapse text-[10px]">
                  <thead className="bg-[#081621] text-white">
                    <tr>
                      <th className="py-2.5 px-4 font-black uppercase text-left w-10">SL</th>
                      <th className="py-2.5 px-4 font-black uppercase text-left">Service Components</th>
                      <th className="py-2.5 px-4 font-black uppercase text-center w-24">Unit/Area</th>
                      <th className="py-2.5 px-4 font-black uppercase text-right w-24">Rate</th>
                      <th className="py-2.5 px-4 font-black uppercase text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold bg-white">
                    {quote.items?.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100 align-top">
                        <td className="px-4 text-left text-gray-400" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>{i + 1}</td>
                        <td className="px-4 text-left" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}><p className="font-black text-gray-900 uppercase leading-tight">{item.name}</p></td>
                        <td className="px-4 text-center text-gray-600 uppercase font-black" style={{ fontSize: `${d.tableFontSize}px` }}>{item.quantity} {item.unit || 'Qty'}</td>
                        <td className="px-4 text-right text-gray-600" style={{ fontSize: `${d.tableFontSize}px` }}>{quote.pricingMode === 'combo' ? '---' : `৳${item.price?.toLocaleString()}`}</td>
                        <td className="px-4 text-right text-[#081621] font-black" style={{ fontSize: `${d.tableFontSize}px` }}>{quote.pricingMode === 'combo' ? '---' : `৳${(item.price * item.quantity).toLocaleString()}`}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white" style={{ backgroundColor: d.primaryColor }}>
                      <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[10px] tracking-[0.2em] italic">Net Proposed Amount</td>
                      <td className="py-3 px-4 text-right font-black text-base">৳{quote.total?.toLocaleString()}/-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border-2 border-gray-100 flex flex-col gap-0.5 text-left mb-6 shrink-0 shadow-inner">
                <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.3em]">Value Proof (In words):</p>
                <p className="text-[10px] font-black text-[#081621] italic leading-none">"{numberToWords(parseFloat(quote.total) || 0)}"</p>
              </div>
              
              <div className="space-y-1.5 mb-6 shrink-0 avoid-break">
                 <h5 className="text-[9px] font-black uppercase tracking-widest border-b pb-0.5 w-fit" style={{ color: d.primaryColor, borderColor: `${d.primaryColor}40` }}>Terms & Conditions</h5>
                 <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="space-y-1">
                      {terms.slice(0, 6).map((term: string, i: number) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-[9px] font-black min-w-[20px]" style={{ color: d.primaryColor }}>{i + 1}.</span>
                          <p className="text-gray-600 leading-tight font-medium" style={{ fontSize: `${d.bodyFontSize - 2}px` }}>{term}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-32 items-end pt-4 shrink-0 avoid-break" style={{ marginTop: `${d.signatureSpacing}px` }}>
                <div className="text-center space-y-2">
                  <div className="border-b-[3px] border-gray-100 h-8"></div>
                  <p className="text-[9px] font-black uppercase text-[#081621]">Client Signature</p>
                </div>
                <div className="flex flex-col items-center justify-end text-center space-y-2 relative">
                  {d.authoritySealUrl && (<div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 opacity-30 z-0 pointer-events-none"><Image src={d.authoritySealUrl} alt="Seal" fill className="object-contain" unoptimized /></div>)}
                  <div className="h-12 w-32 relative border-b-[3px] border-primary/10 flex items-center justify-center z-10">{signatureUrl ? <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized /> : <div className="text-[8px] font-black text-gray-300 uppercase">Authorized</div>}</div>
                  <p className="font-black text-[9px] uppercase text-[#081621] relative z-10">Smart Clean Authority</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="pt-4 border-t border-gray-100 px-12 shrink-0 avoid-break" style={{ marginTop: `${d.footerMarginTop}px`, paddingBottom: `${d.footerPaddingBottom}px` }}>
            <div className="text-center space-y-0.5 mb-2"><p className="font-black flex items-center justify-center gap-2 uppercase tracking-widest" style={{ fontSize: `${d.taglineFontSize}px`, color: d.primaryColor }}>{tagline} <Star size={8} fill="currentColor"/></p></div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
               {providedServices.slice(0, 9).map((service, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-1.5">
                    <CheckCircle2 size={8} className="text-emerald-500 shrink-0" />
                    <span className="text-[8.5px] font-bold text-gray-600 uppercase truncate">{service}</span>
                  </div>
               ))}
            </div>
            <p className="text-[7.5px] text-gray-300 font-bold uppercase text-center mt-4 tracking-[0.3em]">{footerDisclaimer}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function CatchAllQuotationView() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <QuotationViewContent />
    </Suspense>
  )
}
