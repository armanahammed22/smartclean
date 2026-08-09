'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Download, 
  Loader2, 
  MapPin, 
  Globe,
  Mail,
  ShieldCheck,
  Info,
  Printer,
  Wallet,
  Heart,
  Check,
  MessageCircle,
  History,
  Zap,
  Clock,
  Star,
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadInvoicePDF, numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

/**
 * 🛡️ REBORN INVOICE VIEW (Single Segment)
 * Handles standard IDs and acts as a primary viewport.
 */
function InvoiceViewContent() {
  const params = useParams();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const fullId = useMemo(() => {
    if (!params.id) return '';
    const segments = Array.isArray(params.id) ? params.id : [params.id];
    return segments.map(s => decodeURIComponent(s)).join('/');
  }, [params.id]);

  const designRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'document_design') : null, [db]);
  const { data: design } = useDoc(designRef);

  const globalRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(globalRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchInvoice() {
      if (!db || !fullId) return;
      setIsLoading(true);
      try {
        const docRef = collection(db, 'invoices');
        const normalizedId = fullId.toUpperCase().trim();
        
        // 1. Try fetching by invoiceNumber (Canonical SEO URL)
        const qByNum = query(docRef, where('invoiceNumber', '==', normalizedId), limit(1));
        const snapByNum = await getDocs(qByNum);

        if (!snapByNum.empty) {
          setInvoice({ ...snapByNum.docs[0].data(), id: snapByNum.docs[0].id });
          setIsLoading(false);
          return;
        }

        // 2. Try fetching by literal ID (Internal Firebase ID)
        const qById = doc(db, 'invoices', fullId);
        const snapById = await getDoc(qById);

        if (snapById.exists()) {
          setInvoice({ ...snapById.data(), id: snapById.id });
        }
      } catch (e) {
        console.error('[Invoice Fetch Error]:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoice();
  }, [db, fullId]);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'GP.JA-66/2, Wireless Gate, Mohakhali, Dhaka-1212';
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";
  const signatureUrl = settings?.signatureUrl;
  const websiteName = settings?.websiteName || 'Smart Clean';

  const providedServices = useMemo(() => {
    const list = settings?.invoiceProvidedServices || 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control';
    return list.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }, [settings]);

  const terms = useMemo(() => {
    const currentTerms = invoice?.terms || settings?.invoiceDefaultTerms;
    if (!currentTerms) return ["Standard service terms apply."];
    return Array.isArray(currentTerms) ? currentTerms : [currentTerms];
  }, [invoice, settings]);

  const tagline = invoice?.tagline || settings?.invoiceTagline || "Smart Cleaning, Better Living.";

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  
  if (!invoice) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 space-y-6 max-w-md">
        <X size={64} className="mx-auto text-rose-200" />
        <h1 className="text-xl font-black uppercase opacity-60 tracking-[0.2em]">Document Not Found</h1>
        <p className="text-sm text-gray-400 font-medium italic">"{fullId}"</p>
        <p className="text-xs text-gray-400">The reference might have been removed or the URL is incorrect.</p>
        <Button onClick={() => router.push('/')} className="rounded-xl px-10">Back to Site</Button>
      </div>
    </div>
  );

  const d = design || { primaryColor: '#1E5F7A', headerPaddingTop: 5, headerPaddingBottom: 5, sectionSpacing: 10, tableFontSize: 10.5, tableRowPadding: 2, headerFontSize: 22, bodyFontSize: 11, logoSize: 52, showGridLines: true, footerMarginTop: 5, footerPaddingBottom: 5, signatureSpacing: 25, taglineFontSize: 11, disclaimerFontSize: 7.5, paidSealUrl: '', unpaidSealUrl: '', authoritySealUrl: '' };

  const isPaid = invoice.paymentStatus === 'Paid';
  const statusSealUrl = isPaid ? d.paidSealUrl : d.unpaidSealUrl;
  const isCombo = invoice.pricingMode === 'combo';

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-4 md:py-8 pb-32 md:pb-16">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #invoice-render-area { box-shadow: none !important; border-top: none !important; border-radius: 0 !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 px-4 no-print">
          <div className="flex items-center gap-4 text-left">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 bg-white border shadow-sm"><ArrowLeft size={20}/></Button>
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#081621] block">Secure Billing Portal</span>
                <Badge className={cn("border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5 mt-0.5", isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                    {isPaid ? 'Payment Received' : 'Arrears Pending'}
                </Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}`, '_blank')} className="rounded-lg gap-2 font-black uppercase text-[9px] h-9 px-4 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all"><MessageCircle size={16} /> Support</Button>
            <Button className="rounded-lg gap-2 font-black uppercase text-[9px] h-9 px-6 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} DOWNLOAD PDF
            </Button>
          </div>
        </div>

        <div 
          id="invoice-render-area" 
          className="bg-white shadow-2xl relative border-t-[14px] border-[#1E5F7A] overflow-hidden" 
          style={{ 
            width: '210mm', 
            height: '297mm', 
            maxHeight: '297mm',
            color: '#333', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderRadius: '0 0 1.5rem 1.5rem'
          }}
        >
          {statusSealUrl && (
            <div className="absolute top-48 right-16 z-50 opacity-25 rotate-[20deg] pointer-events-none w-48 h-48">
              <Image src={statusSealUrl} alt="Status Seal" fill className="object-contain" unoptimized />
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-12 flex justify-between items-start border-b-2 border-gray-50 shrink-0" style={{ paddingTop: `${d.headerPaddingTop}px`, paddingBottom: `${d.headerPaddingBottom}px` }}>
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
            </header>

            <div className="px-12 py-6 space-y-4 flex-1 overflow-hidden" style={{ marginTop: `${d.sectionSpacing}px` }}>
              <div className="text-center space-y-0.5 shrink-0"><h3 className="text-xl font-black uppercase tracking-tighter italic text-[#081621]">Tax Invoice / Bill</h3><div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: d.primaryColor }} /></div>

              <div className="flex justify-between items-start shrink-0">
                <div className="text-left space-y-1.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] border-b pb-0.5 w-fit" style={{ color: d.primaryColor, borderColor: `${d.primaryColor}40` }}>Customer Profile</p>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-[#081621] uppercase tracking-tight leading-none" style={{ fontSize: `${d.bodyFontSize + 1}px` }}>{invoice.customerInfo?.name}</h4>
                    <p className="text-[9px] font-bold text-gray-600">{invoice.customerInfo?.phone}</p>
                    <p className="text-[8px] text-gray-500 font-medium leading-relaxed max-w-[400px] uppercase italic">{invoice.customerInfo?.address}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Invoice Ref.</p><p className="text-sm font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p></div>
                  <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Billing Date</p><p className="text-[10px] font-black text-[#081621]">{invoice.createdAt ? format(new Date(invoice.createdAt), 'dd MMM yyyy') : 'N/A'}</p></div>
                </div>
              </div>

              <div className={cn("overflow-hidden rounded-xl mb-2", d.showGridLines ? "border-2 border-[#081621]" : "border-none shadow-sm")}>
                <table className="w-full border-collapse text-[10px]">
                  <thead className="bg-[#081621] text-white">
                    <tr>
                      <th className="py-2 px-4 font-black uppercase text-left w-10 text-[10px]">SL</th>
                      <th className="py-2 px-4 font-black uppercase text-left text-[10px]">Description</th>
                      <th className="py-2 px-4 font-black uppercase text-center w-24 text-[10px]">Unit/Area</th>
                      <th className="py-2 px-4 font-black uppercase text-right w-24 text-[10px]">Rate</th>
                      <th className="py-2 px-4 font-black uppercase text-right w-28 text-[10px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold bg-white">
                    {invoice.items?.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100 align-top">
                        <td className="px-4 text-left text-gray-400" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>{i + 1}</td>
                        <td className="px-4 text-left" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>
                          <p className="font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                        </td>
                        <td className="px-4 text-center text-gray-600 uppercase font-black" style={{ fontSize: `${d.tableFontSize}px` }}>{item.quantity} {item.unit || 'Qty'}</td>
                        <td className="px-4 text-right text-gray-600" style={{ fontSize: `${d.tableFontSize}px` }}>{isCombo ? '---' : `৳${item.price?.toLocaleString()}`}</td>
                        <td className="px-4 text-right text-[#081621] font-black" style={{ fontSize: `${d.tableFontSize}px` }}>{isCombo ? '---' : `৳${(item.price * item.quantity).toLocaleString()}`}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#081621] bg-gray-50/50">
                      <td colSpan={4} className="py-2 px-8 text-right font-black uppercase text-[9px] tracking-widest">Grand Total Payable</td>
                      <td className="py-2 px-4 text-right font-black text-sm text-[#081621]">৳{invoice.total?.toLocaleString()}/-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-0.5 text-left shrink-0 shadow-inner">
                <p className="text-[7px] font-black uppercase text-gray-400 tracking-[0.3em]">Total Amount (In words):</p>
                <p className="text-[10px] font-black text-[#081621] italic">"{numberToWords(parseFloat(invoice.total) || 0)}"</p>
              </div>

              <div className="space-y-1.5 overflow-hidden">
                 <h5 className="text-[9px] font-black uppercase tracking-widest border-b pb-0.5 w-fit" style={{ color: d.primaryColor, borderColor: `${d.primaryColor}40` }}>Terms & Conditions</h5>
                 <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-inner">
                    <div className="grid grid-cols-1 gap-0.5">
                      {terms.slice(0, 8).map((term: string, i: number) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-[9px] font-black min-w-[12px]" style={{ color: d.primaryColor }}>{i + 1}.</span>
                          <p className="font-medium text-gray-600 leading-tight" style={{ fontSize: `${d.bodyFontSize - 2}px` }}>{term}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-32 items-end pt-2 pb-2 shrink-0" style={{ marginTop: `${d.signatureSpacing}px` }}>
                <div className="text-center space-y-1.5"><div className="border-b-[2px] border-gray-100 h-6"></div><p className="text-[9px] font-black uppercase text-[#081621]">Client Signature</p></div>
                <div className="flex flex-col items-center justify-end text-center space-y-1.5 relative">
                  {d.authoritySealUrl && (<div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 opacity-30 z-0 pointer-events-none"><Image src={d.authoritySealUrl} alt="Seal" fill className="object-contain" unoptimized /></div>)}
                  <div className="h-10 w-24 relative border-b-[2px] border-primary/10 flex items-center justify-center z-10">{signatureUrl ? <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized /> : <Badge variant="outline" className="text-[7px] font-black border-dashed border-primary/30 text-primary uppercase h-5">Authorized</Badge>}</div>
                  <p className="font-black text-[9px] uppercase text-[#081621] relative z-10">Smart Clean Authority</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="pt-2 border-t border-gray-100 px-12 shrink-0" style={{ marginTop: `${d.footerMarginTop}px`, paddingBottom: `${d.footerPaddingBottom}px` }}>
             <div className="text-center space-y-0.5 mb-2"><p className="font-black flex items-center justify-center gap-2 uppercase tracking-widest" style={{ fontSize: `${d.taglineFontSize}px`, color: d.primaryColor }}>{invoice.tagline || settings?.invoiceTagline || "Smart Cleaning, Better Living."} <Star size={8} fill="currentColor"/></p></div>
             <div className="grid grid-cols-3 gap-x-6 gap-y-0.5">{providedServices.slice(0, 9).map((service: string, sIdx: number) => (<div key={sIdx} className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-500 shrink-0" /><span className="text-[9px] font-bold text-gray-600 uppercase truncate">{service}</span></div>))}</div>
             <p className="font-bold uppercase text-center mt-3 tracking-[0.3em] text-gray-300" style={{ fontSize: `${d.disclaimerFontSize}px` }}>{settings?.invoiceFooterDisclaimer || "ELECTRONICALLY VERIFIED DOCUMENT"}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function SingleInvoiceView() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <InvoiceViewContent />
    </Suspense>
  )
}
