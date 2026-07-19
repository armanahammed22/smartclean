'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
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
  Check,
  MessageCircle,
  History,
  Zap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadInvoicePDF, numberToWords } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

/**
 * Clean SEO URL Public Invoice View
 * Handles both Document ID and Invoice Number.
 */
export default function PublicInvoiceViewPage() {
  const { id } = useParams();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Logic (Handle ID or Number)
  useEffect(() => {
    async function fetchInvoice() {
      if (!db || !id) return;
      setIsLoading(true);
      try {
        // 1. Try fetching by Document ID
        const docRef = collection(db, 'invoices');
        const qById = query(docRef, where('__name__', '==', id), limit(1));
        const snapById = await getDocs(qById);

        if (!snapById.empty) {
          const data = snapById.docs[0].data();
          if (data.invoiceNumber && id !== data.invoiceNumber) {
            router.replace(`/invoice/${data.invoiceNumber}`);
            return;
          }
          setInvoice({ ...data, id: snapById.docs[0].id });
          setIsLoading(false);
          return;
        }

        // 2. Try fetching by Invoice Number (SEO URL)
        const qByNum = query(docRef, where('invoiceNumber', '==', id), limit(1));
        const snapByNum = await getDocs(qByNum);

        if (!snapByNum.empty) {
          setInvoice({ ...snapByNum.docs[0].data(), id: snapByNum.docs[0].id });
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoice();
  }, [db, id, router]);

  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    if (db) {
      getDocs(query(collection(db, 'site_settings'), where('__name__', '==', 'global'), limit(1))).then(snap => {
        if (!snap.empty) setSettings(snap.docs[0].data());
      });
    }
  }, [db]);

  const headerPhone = settings?.invoiceHeaderPhone || settings?.contactPhone || '+8801919640422';
  const headerAddress = settings?.invoiceHeaderAddress || settings?.address || 'Wireless Gate, Mohakhali, Dhaka';
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";
  const signatureUrl = settings?.signatureUrl;
  const websiteName = settings?.websiteName || 'Smart Clean';

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = `আসসালামু আলাইকুম, আমি আমার ইনভয়েস (${invoice.invoiceNumber}) সম্পর্কে জানতে চাই।`;
    window.open(`https://wa.me/${headerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Secure Document Not Found</div>;

  const isDue = (invoice.dueAmount || 0) > 0;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16 selection:bg-primary selection:text-white pb-32 md:pb-16">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 px-4 text-center sm:text-left no-print">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-[#081621] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border border-white/10">SC</div>
            <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#081621] block">Secure Billing Portal</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1">Verified Document</Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={handleWhatsApp} className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-6 border-emerald-200 text-emerald-700 bg-emerald-50"><MessageCircle size={18} /> WhatsApp</Button>
            <Button className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-10 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20" onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={16} />} DOWNLOAD PDF
            </Button>
          </div>
        </div>

        <div id="invoice-render-area" className="bg-white shadow-2xl relative border-t-[10px] border-[#1E5F7A]" style={{ width: '210mm', minHeight: 'auto', color: '#333' }}>
          <header className="pt-10 px-12 pb-4 flex justify-between items-start border-b-2 border-gray-100 mb-8">
            <div className="flex gap-4">
              <div className="w-14 h-14 relative shrink-0"><Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized /></div>
              <div className="space-y-0.5 text-left">
                <h2 className="text-xl font-black text-[#081621] tracking-tighter uppercase leading-none">{websiteName}</h2>
                <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Professional Infrastructure</p>
              </div>
            </div>
            <div className="text-left space-y-0.5 max-w-[250px]">
              <p className="text-[8px] font-bold text-gray-600 leading-normal uppercase">{headerAddress}</p>
              <p className="text-[8px] font-bold text-[#081621] uppercase mt-1">Cell: <span className="font-black">{headerPhone}</span></p>
            </div>
          </header>

          <div className="px-12 pb-10">
            <div className="flex justify-between items-start mb-8">
              <div className="text-left space-y-2">
                <p className="text-[8px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-0.5 w-fit">Bill Recipient</p>
                <h4 className="text-lg font-black text-[#081621] uppercase tracking-tight">{invoice.customerInfo.name}</h4>
                <p className="text-[9px] font-bold text-gray-700">{invoice.customerInfo.phone}</p>
                <p className="text-[8px] text-gray-500 font-medium leading-normal max-w-[300px]">{invoice.customerInfo.address}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Invoice Ref.</p>
                <p className="text-base font-black text-[#081621] font-mono tracking-tighter">{invoice.invoiceNumber}</p>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-4">Date</p>
                <p className="text-[11px] font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
              </div>
            </div>

            <div className="overflow-hidden border border-[#081621] rounded-xl shadow-sm mb-6">
              <table className="w-full border-collapse text-[10px]">
                <thead className="bg-[#081621] text-white">
                  <tr>
                    <th className="py-2 px-3 font-black uppercase text-left w-10">SL</th>
                    <th className="py-2 px-3 font-black uppercase text-left">Service & Description</th>
                    <th className="py-2 px-3 font-black uppercase text-center w-24">Qty</th>
                    <th className="py-2 px-3 font-black uppercase text-right w-24">Price</th>
                    <th className="py-2 px-3 font-black uppercase text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="font-bold bg-white">
                  {invoice.items.map((item: any, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-3 px-3 text-left text-gray-400">{i + 1}</td>
                      <td className="py-3 px-3 text-left">
                        <p className="font-black text-gray-900 uppercase leading-tight mb-1">{item.name}</p>
                      </td>
                      <td className="py-3 px-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-3 text-right">৳{item.price.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">৳{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-[#081621] bg-[#1E5F7A] text-white">
                    <td colSpan={4} className="py-3 px-8 text-right font-black uppercase text-[9px] tracking-widest italic">Net Total Amount</td>
                    <td className="py-3 px-3 text-right font-black text-xs">৳{invoice.total.toLocaleString()}/-</td>
                  </tr>
                  <tr className="border-t border-[#081621] bg-rose-50/80 text-rose-700">
                    <td colSpan={4} className="py-2 px-8 text-right font-black uppercase text-[9px]">Net Due Amount</td>
                    <td className="py-2 px-3 text-right font-black text-xs">৳{invoice.dueAmount?.toLocaleString() || 0}/-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="avoid-break grid grid-cols-2 gap-32 items-end pt-12 pb-10">
              <div className="text-center space-y-4">
                <div className="border-b border-gray-100 h-8"></div>
                <p className="text-[8px] font-black uppercase text-[#081621]">Client Signature</p>
              </div>
              <div className="flex flex-col items-center justify-end text-center space-y-2">
                <div className="h-12 w-24 relative border-b border-primary/10 flex items-center justify-center">
                  {signatureUrl ? <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized /> : <div className="text-[6px] font-black text-gray-200 uppercase">Authorized</div>}
                </div>
                <p className="font-black text-[8px] uppercase text-[#081621]">Smart Clean Authority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
