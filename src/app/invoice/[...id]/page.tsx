'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
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
  Printer,
  MessageCircle,
  History,
  Zap,
  Clock,
  Star,
  X,
  ArrowLeft,
  ReceiptText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadInvoicePDF, numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

/**
 * 🛡️ ROBUST INVOICE VIEW
 * Handles slashes and direct IDs: /invoice/INV/SM/2026/1001
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
    const rawId = params.id;
    if (!rawId) return '';
    const segments = Array.isArray(rawId) ? rawId : [rawId];
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
        
        // 1. Search by invoiceNumber field
        const qByNum = query(docRef, where('invoiceNumber', '==', normalizedId), limit(1));
        const snapByNum = await getDocs(qByNum);

        if (!snapByNum.empty) {
          setInvoice({ ...snapByNum.docs[0].data(), id: snapByNum.docs[0].id });
          setIsLoading(false);
          return;
        }

        // 2. Fallback to direct Document ID
        const qById = doc(db, 'invoices', fullId);
        const snapById = await getDoc(qById);

        if (snapById.exists()) {
          setInvoice({ ...snapById.data(), id: snapById.id });
        }
      } catch (e) {
        console.error('[Invoice Protocol Failure]:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoice();
  }, [db, fullId]);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.invoiceHeaderEmail || settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'GP.JA-66/2, Wireless Gate, Mohakhali, Dhaka-1212';
  
  const websiteName = settings?.websiteName || 'Smart Clean';
  const tagline = invoice?.tagline || settings?.invoiceTagline || "Smart Cleaning, Better Living.";
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || 'This is a computer generated document and does not require a physical stamp.';
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";
  const signatureUrl = settings?.signatureUrl;

  const isDue = (invoice?.dueAmount || 0) > 0;
  const isQuotation = invoice?.invoiceNumber?.startsWith('QTN');

  const providedServices = useMemo(() => {
    const list = settings?.invoiceProvidedServices || 'Home Cleaning, Office Cleaning, Deep Cleaning, Sofa & Carpet, Kitchen Sanitization, Pest Control';
    return list.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }, [settings]);

  const terms = useMemo(() => {
    const currentTerms = invoice?.terms || settings?.invoiceDefaultTerms;
    if (!currentTerms) return ["Standard service terms apply."];
    return Array.isArray(currentTerms) ? currentTerms : [currentTerms];
  }, [invoice, settings]);

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  
  if (!invoice) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 space-y-6 max-w-md animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-primary">
           <ReceiptText size={40} />
        </div>
        <h1 className="text-xl font-black uppercase opacity-60 tracking-[0.2em]">Document Not Found</h1>
        <p className="text-sm text-gray-400 font-medium italic">Reference: "{fullId}"</p>
        <p className="text-xs text-gray-400 leading-relaxed">Please check the invoice number or contact our support team.</p>
        <Button onClick={() => router.push('/')} className="rounded-xl px-10 h-12 w-full font-black uppercase shadow-lg shadow-primary/20">Back to Home</Button>
      </div>
    </div>
  );

  const d = design || { primaryColor: '#1E5F7A', headerPaddingTop: 5, headerPaddingBottom: 5, sectionSpacing: 10, tableFontSize: 10.5, tableRowPadding: 2, headerFontSize: 22, bodyFontSize: 11, logoSize: 52, showGridLines: true, footerMarginTop: 5, footerPaddingBottom: 5, signatureSpacing: 25, taglineFontSize: 11, disclaimerFontSize: 7.5, paidSealUrl: '', unpaidSealUrl: '', authoritySealUrl: '' };

  const isPaid = invoice.paymentStatus === 'Paid';
  const statusSealUrl = isPaid ? d.paidSealUrl : d.unpaidSealUrl;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-4 md:py-12 pb-32 md:pb-16 selection:bg-primary selection:text-white">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #invoice-render-area { box-shadow: none !important; border-top: none !important; border-radius: 0 !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 px-4 no-print">
          <div className="flex items-center gap-4 text-left">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-xl h-10 w-10 bg-white border shadow-sm"><ArrowLeft size={20}/></Button>
            <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#081621] block">Authorized Billing Portal</span>
                <Badge className={cn("border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1", isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                    {isPaid ? 'Payment Received' : 'Balance Due'}
                </Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-6 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm" onClick={() => window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}`, '_blank')}><MessageCircle size={18} /> WhatsApp</Button>
            <Button className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-10 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>{isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} EXPORT INVOICE</Button>
          </div>
        </div>

        <div 
          id="invoice-render-area" 
          className="bg-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative border-t-[14px] border-[#1E5F7A] rounded-b-[2rem] overflow-hidden"
          style={{ width: '210mm', minHeight: '297mm', color: '#333' }}
        >
          {statusSealUrl && (
            <div className="absolute top-48 right-16 z-50 opacity-25 rotate-[20deg] pointer-events-none w-48 h-48">
              <Image src={statusSealUrl} alt="Status Seal" fill className="object-contain" unoptimized />
            </div>
          )}

          <div className="px-12 flex justify-between items-start border-b-[3px] border-gray-50" style={{ paddingTop: `${d.headerPaddingTop}px`, paddingBottom: `${d.headerPaddingBottom}px` }}>
            <div className="flex gap-4">
              <div className="relative shrink-0" style={{ width: `${d.logoSize}px`, height: `${d.logoSize}px` }}>
                <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
              </div>
              <div className="space-y-0.5 text-left flex flex-col justify-center">
                <h2 className="font-black text-[#081621] tracking-tighter uppercase leading-none" style={{ fontSize: `${d.headerFontSize}px` }}>{websiteName}</h2>
                <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Professional Infrastructure</p>
              </div>
            </div>
            <div className="text-right max-w-[280px]">
              <p className="text-[8px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
              <p className="text-[8px] font-bold text-[#081621] uppercase mt-1">Cell: <span className="font-black">{headerPhone}</span></p>
            </div>
          </div>

          <div className="px-12 pb-10 flex-1 flex flex-col" style={{ marginTop: `${d.sectionSpacing}px` }}>
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
                  <p className="text-[11px] font-black text-[#081621]">{invoice.createdAt ? format(new Date(invoice.createdAt), 'dd MMMM yyyy') : 'N/A'}</p>
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
                  {invoice.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-t-2 border-gray-50 align-top">
                      <td className="px-4 text-left text-gray-400" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>{i + 1}</td>
                      <td className="px-4 text-left" style={{ fontSize: `${d.tableFontSize}px`, paddingTop: `${d.tableRowPadding}px`, paddingBottom: `${d.tableRowPadding}px` }}>
                        <p className="font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                      </td>
                      <td className="px-4 text-center text-gray-600 uppercase font-black" style={{ fontSize: `${d.tableFontSize}px` }}>{item.quantity} {item.unit || 'PCS'}</td>
                      <td className="px-4 text-right text-gray-600" style={{ fontSize: `${d.tableFontSize}px` }}>৳{item.price?.toLocaleString()}</td>
                      <td className="px-4 text-right text-[#081621] font-black" style={{ fontSize: `${d.tableFontSize}px` }}>৳{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                  
                  <tr className="border-t-[3px] border-[#081621] bg-gray-50/50">
                    <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[9px] tracking-widest">Base Subtotal</td>
                    <td className="py-3 px-4 text-right font-black text-xs">৳{invoice.subtotal?.toLocaleString()}</td>
                  </tr>

                  {invoice.previousDue > 0 && (
                    <tr className="border-t border-gray-100 bg-white">
                      <td colSpan={4} className="py-2.5 px-8 text-right font-black uppercase text-[9px] tracking-widest text-rose-500">Previous Arrears</td>
                      <td className="py-2.5 px-4 text-right font-black text-xs text-rose-500">৳{invoice.previousDue.toLocaleString()}</td>
                    </tr>
                  )}

                  <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                    <td colSpan={4} className="py-4 px-8 text-right font-black uppercase text-[10px] tracking-[0.2em] italic">Net Payable Amount</td>
                    <td className="py-4 px-4 text-right font-black text-sm">৳{invoice.total?.toLocaleString()}</td>
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

            {terms && terms.length > 0 && (
              <div className="space-y-2 mb-8">
                 <h5 className="text-[9px] font-black uppercase tracking-widest border-b border-primary/20 pb-0.5 w-fit" style={{ color: d.primaryColor }}>Terms & Conditions</h5>
                 <div className="grid grid-cols-1 gap-1">
                    {terms.map((term: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-[9px] font-black" style={{ color: d.primaryColor }}>{i + 1}.</span>
                        <p className="text-[9px] font-medium text-gray-600 leading-tight">{term}</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="avoid-break grid grid-cols-2 gap-32 items-end pt-10 mt-auto" style={{ marginTop: `${d.signatureSpacing}px` }}>
              <div className="text-center space-y-4">
                <div className="border-b-[3px] border-gray-100 h-10"></div>
                <p className="text-[10px] font-black uppercase text-[#081621]">Client Signature</p>
              </div>
              <div className="flex flex-col items-center justify-end text-center space-y-4 relative">
                {d.authoritySealUrl && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 opacity-30 z-0 pointer-events-none">
                    <Image src={d.authoritySealUrl} alt="Seal" fill className="object-contain" unoptimized />
                  </div>
                )}
                <div className="h-16 w-32 relative border-b-[3px] border-primary/10 flex items-center justify-center z-10">
                  {signatureUrl ? <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized /> : <div className="text-[8px] font-black text-gray-300 uppercase">Authorized</div>}
                </div>
                <p className="font-black text-[10px] uppercase text-[#081621] relative z-10">Smart Clean Authority</p>
              </div>
            </div>
          </div>

          <footer className="pt-6 border-t border-gray-100 px-12 shrink-0" style={{ marginTop: `${d.footerMarginTop}px`, paddingBottom: `${d.footerPaddingBottom}px` }}>
            <div className="text-center space-y-0.5 mb-2">
                <p className="font-black flex items-center justify-center gap-2 uppercase tracking-widest" style={{ fontSize: `${d.taglineFontSize}px`, color: d.primaryColor }}>{tagline} <Star size={8} fill="currentColor"/></p>
            </div>
            
            <div className="grid grid-cols-3 gap-x-6 gap-y-0.5">
                {providedServices.slice(0, 9).map((service, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2">
                      <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                      <span className="text-[9px] font-bold text-gray-600 uppercase truncate">{service}</span>
                  </div>
                ))}
            </div>

            <p className="font-bold uppercase text-center mt-3 tracking-[0.3em] text-gray-300" style={{ fontSize: `${d.disclaimerFontSize}px` }}>{footerDisclaimer}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function CatchAllInvoiceView() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <InvoiceViewContent />
    </Suspense>
  );
}
