
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
  Check,
  Building2,
  ShieldCheck,
  CreditCard,
  Share2,
  MoreVertical,
  X
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

  if (isLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-[10px] font-black uppercase text-gray-400">Loading Document...</p></div>;
  if (!invoice) return <div className="p-32 text-center uppercase font-black opacity-20 tracking-[0.5em]">Secure Ledger Missing</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerEmail = settings?.invoiceHeaderEmail || settings?.contactEmail || 'smartclean422@gmail.com';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  
  const websiteName = settings?.websiteName || 'Smart Clean';
  const footerDisclaimer = settings?.invoiceFooterDisclaimer || 'This is a computer generated document and does not require a physical stamp.';

  const isDue = (invoice.dueAmount || 0) > 0;
  const isQuotation = invoice.invoiceNumber?.startsWith('QTN');

  const handleWhatsApp = () => {
    const text = `আসসালামু আলাইকুম, ইনভয়েস (${invoice.invoiceNumber}) টি চেক করার জন্য অনুরোধ করা হলো।`;
    window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const terms = isQuotation ? [
    'Quotation valid for 7 days.',
    'Final cost may vary based on actual condition/work scope.',
    'Advance payment may be required for booking.',
    'Extra services will incur additional charges.',
    'Taxes/shipping not included unless mentioned.'
  ] : [
    'Payment is due upon completion or as agreed.',
    'Service once delivered is non-refundable.',
    'Any issues must be reported within 24 hours.',
    'Client must provide access to service area on time.',
    'Additional work will be charged separately.'
  ];

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
          <Button variant="outline" onClick={handleWhatsApp} className="gap-2 font-black uppercase text-[10px] h-12 px-6 border-emerald-500/30 text-emerald-400 bg-white/5 hover:bg-emerald-500/10">
            <MessageCircle size={18} /> WhatsApp Share
          </Button>
          <Button className="gap-2 font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-2xl bg-primary hover:bg-[#15435a] text-white" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={18} />} Export Document
          </Button>
        </div>
      </div>

      {/* 📄 THE ACTUAL INVOICE DOCUMENT */}
      <div className="overflow-x-auto no-scrollbar flex justify-center pb-20 animate-in fade-in zoom-in-95 duration-700">
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
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest pt-1">Operations Command</p>
                      </div>
                    </div>
                    <div className="flex-1 text-right space-y-1">
                      <p className="text-[9px] font-bold text-gray-700 leading-normal uppercase">{headerAddress}</p>
                      <p className="text-[9px] font-bold text-[#081621] uppercase">Cell: <span className="font-black">{headerPhone}</span></p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase">{headerEmail}</p>
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest">www.smartclean.com.bd</p>
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
                          <th className="py-2 px-4 text-[9px] font-black uppercase text-left border-r border-white/10">Description of Service/Items</th>
                          <th className="py-2 px-4 text-[9px] font-black uppercase text-center w-24 border-r border-white/10">Qty/Scale</th>
                          <th className="py-2 px-4 text-[9px] font-black uppercase text-right w-28 border-r border-white/10">Unit Rate (৳)</th>
                          <th className="py-2 px-4 text-[9px] font-black uppercase text-right w-32">Amount (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold bg-white">
                        {invoice.items.map((item: any, i: number) => (
                          <React.Fragment key={i}>
                            <tr className="border-t-2 border-gray-50">
                              <td className="py-3 text-center text-gray-400 border-r border-gray-50">{i + 1}</td>
                              <td className="py-3 px-4 uppercase text-gray-900 text-left border-r border-gray-50">
                                <div>{item.name}</div>
                                {item.type === 'package' && (
                                  <div className="mt-2 pl-2 space-y-1">
                                    {item.subItems?.map((si: string, sidx: number) => (
                                      <div key={sidx} className="flex items-center gap-2 text-[8px] font-bold text-primary">
                                        <Check size={8} strokeWidth={4} /> {si}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 text-center text-gray-600 border-r border-gray-50">
                                {item.quantity} <span className="text-[7px] uppercase font-black opacity-30 ml-1">{item.unit || 'Qty'}</span>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600 border-r border-gray-50">৳{item.price?.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-[#081621] bg-gray-50/20">৳{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        
                        <tr className="border-t-2 border-[#081621] bg-gray-50/50">
                          <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] tracking-widest border-r border-[#081621]">Gross Subtotal</td>
                          <td className="py-2 px-4 text-right font-black text-xs text-[#081621]">৳{invoice.subtotal.toLocaleString()}</td>
                        </tr>

                        {invoice.discount > 0 && (
                          <tr className="border-t border-[#081621] bg-white">
                            <td colSpan={4} className="py-2 px-6 text-right font-black uppercase text-[9px] tracking-widest border-r border-[#081621] text-rose-600">Savings / Promotional (-)</td>
                            <td className="py-2 px-4 text-right font-black text-xs text-rose-600">৳{invoice.discount.toLocaleString()}</td>
                          </tr>
                        )}

                        <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white">
                          <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[10px] tracking-[0.2em] border-r border-white/10 italic">
                            Net Amount Payable
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-black tracking-tight leading-none whitespace-nowrap">৳{invoice.total.toLocaleString()}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col gap-1 text-left mb-8">
                    <p className="text-[7px] font-black uppercase text-gray-400 tracking-[0.3em]">Official Amount Proof:</p>
                    <p className="text-[11px] font-black text-[#081621] italic leading-tight">"{numberToWords(invoice.total)}"</p>
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <td className="px-12">
                  <div className="avoid-break space-y-8 pb-10">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-3 border-b-2 border-primary/10 pb-1.5 w-fit">General Protocols</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {terms.map((term, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-[8.5px] font-bold text-gray-600 leading-tight">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{term}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-32 items-end pt-10">
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
                        <div>
                          <p className="font-black text-[10px] uppercase text-[#081621] tracking-tighter leading-none">Authorized Control</p>
                          <p className="text-[7px] font-bold text-primary uppercase tracking-[0.2em] mt-2">Smart Clean Logistics</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t-2 border-gray-50 text-center space-y-1.5">
                      <p className="text-xs font-black text-primary flex items-center justify-center gap-2">
                        <Heart size={14} fill="currentColor" /> Strategic Partner for Professional Maintenance
                      </p>
                      <p className="text-[8px] text-gray-300 uppercase font-black tracking-widest">{footerDisclaimer}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
