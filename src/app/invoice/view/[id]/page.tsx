
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { 
  CheckCircle2, 
  Download, 
  Loader2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Zap,
  Globe,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { downloadInvoicePDF } from '@/lib/invoice-utils';
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

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Secure Invoice Not Found</div>;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">SC</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#081621]">Secure Portal</span>
          </div>
          <Button 
            variant="outline" 
            className="rounded-full gap-2 font-black uppercase text-[10px] h-10 px-6 border-primary/20 text-primary shadow-sm bg-white"
            onClick={() => { setIsDownloading(true); downloadInvoicePDF('public-invoice-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} Download PDF
          </Button>
        </div>

        {/* Invoice Main Area */}
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100" id="public-invoice-area">
          {/* Header Banner */}
          <div className="bg-[#081621] p-8 md:p-12 text-white flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Official Invoice</h1>
              <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/5">
                <CheckCircle2 size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Digital Document</span>
              </div>
            </div>
            <div className="text-left md:text-right space-y-1">
              <p className="text-[10px] font-black uppercase opacity-40">Invoice Reference</p>
              <p className="text-2xl font-black tracking-tight">{invoice.invoiceNumber}</p>
              <p className="text-[10px] font-bold text-primary uppercase mt-2">Issued: {format(new Date(invoice.createdAt), 'PP')}</p>
            </div>
          </div>

          <div className="p-8 md:p-16 space-y-12">
            {/* Customer & Totals Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Billing To</p>
                  <h3 className="text-xl font-black uppercase text-[#081621]">{invoice.customerInfo.name}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Phone size={16} className="text-primary" /> {invoice.customerInfo.phone}
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-500 font-medium leading-relaxed">
                    <MapPin size={16} className="text-primary mt-1 shrink-0" /> {invoice.customerInfo.address}
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 flex flex-col justify-center items-center text-center gap-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Amount Due</p>
                <p className="text-5xl font-black text-[#081621] tracking-tighter">৳{invoice.total.toLocaleString()}</p>
                <Badge className={cn(
                  "mt-2 px-4 py-1 font-black uppercase border-none text-[10px]",
                  invoice.paymentStatus === 'Paid' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}>
                  {invoice.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-4 flex items-center gap-2">
                <Zap size={14} fill="currentColor" /> Service & Product Breakdown
              </h4>
              <div className="space-y-4">
                {invoice.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center group py-2">
                    <div className="space-y-1">
                      <p className="font-black text-[#081621] uppercase text-sm group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Category: {item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#081621]">৳{(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary List */}
            <div className="pt-8 border-t-2 border-dashed border-gray-100 flex flex-col items-end gap-3">
              <div className="w-full max-w-[280px] space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                  <span>Subtotal</span>
                  <span>৳{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                  <span>VAT (8%)</span>
                  <span>৳{invoice.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-[#081621] uppercase tracking-tighter pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary">৳{invoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Call to Action */}
            {invoice.paymentStatus !== 'Paid' && (
              <div className="mt-12 p-8 bg-blue-600 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-blue-600/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl"><Wallet size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Ready to Pay?</h3>
                    <p className="text-white/60 text-xs font-medium">Complete your payment securely via our automated gateways.</p>
                  </div>
                </div>
                <Button className="w-full h-16 rounded-2xl bg-white text-blue-600 hover:bg-gray-100 font-black text-lg uppercase tracking-tight gap-2 shadow-xl">
                  Proceed to Payment <ArrowRight size={20} />
                </Button>
              </div>
            )}

            {/* Support Notice */}
            <div className="pt-12 text-center space-y-2 opacity-40">
              <p className="text-[9px] font-black uppercase tracking-widest">Electronic Transaction ID: {invoice.id}</p>
              <p className="text-[10px] font-bold">For any billing issues, please contact Smart Clean BD Support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
