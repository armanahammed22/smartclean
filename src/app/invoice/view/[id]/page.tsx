
'use client';

import React, { useState, useEffect } from 'react';
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
  Calendar,
  Wallet
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

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Secure Document Not Found</div>;

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 flex flex-col items-center">
        
        {/* Document Actions Bar */}
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#081621] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg">SC</div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#081621]">Public Billing Portal</span>
                <span className="text-[8px] font-bold text-green-600 uppercase flex items-center gap-1"><ShieldCheck size={10}/> Authenticated Secure View</span>
            </div>
          </div>
          <Button 
            className="rounded-full gap-2 font-black uppercase text-[10px] h-11 px-10 bg-[#1E5F7A] shadow-xl hover:scale-105 transition-transform"
            onClick={() => { setIsDownloading(true); downloadInvoicePDF('public-invoice-render', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} SAVE COPY AS PDF
          </Button>
        </div>

        {/* 📄 CORPORATE INVOICE RENDER AREA */}
        <div 
          id="public-invoice-render" 
          className="bg-white shadow-2xl overflow-hidden relative"
          style={{ width: '210mm', minHeight: '297mm', color: '#333' }}
        >
          {/* Header Graphics & Company Meta */}
          <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-2 z-10 text-[10px] font-bold text-[#1E5F7A]">
            <div className="flex items-center gap-2"><Phone size={12}/> 01919640422</div>
            <div className="flex items-center gap-2"><Mail size={12}/> smartclean422@gmail.com</div>
            <div className="flex items-center gap-2"><Globe size={12}/> www.smartclean.com.bd</div>
          </div>

          <div className="pt-8 px-12 relative">
             <div className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 relative">
                   <Image src="https://picsum.photos/seed/smartclean-logo/512/512" alt="Logo" fill className="object-contain" unoptimized />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#1E5F7A] tracking-tighter italic leading-none">Smart Clean</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Professional Cleaning Solutions</p>
                </div>
             </div>

             {/* Wave Decoration Graphic */}
             <div className="absolute top-24 left-0 right-0 h-12 pointer-events-none opacity-20">
                <svg viewBox="0 0 1440 320" className="w-full h-full"><path fill="#22C55E" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>
             </div>
          </div>

          <div className="px-16 pt-16 space-y-12">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-black text-[#1E5F7A] uppercase tracking-widest">Client Details:</p>
                  <div className="space-y-0.5">
                    <p className="text-lg font-black text-[#081621] uppercase leading-none">{invoice.customerInfo.name}</p>
                    <p className="text-xs font-bold text-gray-700">{invoice.customerInfo.phone}</p>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[280px]">{invoice.customerInfo.address}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-[#1E5F7A] uppercase">Invoice ID</p>
                    <p className="text-sm font-black text-[#081621]">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-[#1E5F7A] uppercase">Billing Date</p>
                    <p className="text-sm font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
             </div>

             <div className="text-center">
                <h3 className="text-xl font-black uppercase text-[#1E5F7A] border-b-2 border-[#1E5F7A] inline-block pb-1 tracking-tight">
                  {invoice.projectId ? 'SERVICE QUOTATION DOCUMENT' : 'OFFICIAL SALES INVOICE'}
                </h3>
             </div>

             {/* Corporate Service Table */}
             <div className="overflow-hidden border-2 border-black rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-[#00A8B5] text-white">
                    <tr>
                      <th className="py-2.5 px-3 text-[10px] font-black border-r border-black uppercase w-12">SL.</th>
                      <th className="py-2.5 px-3 text-[10px] font-black border-r border-black uppercase text-left">Description of Services</th>
                      <th className="py-2.5 px-3 text-[10px] font-black border-r border-black uppercase w-20">Qty</th>
                      <th className="py-2.5 px-3 text-[10px] font-black uppercase w-32">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-medium">
                    {invoice.items.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-black">
                        <td className="py-4 text-center border-r border-black font-black">{i + 1}</td>
                        <td className="py-4 px-3 border-r border-black font-black uppercase">
                          <div className="flex flex-col gap-1">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="w-fit text-[7px] font-black border-primary/20 text-primary h-4 px-1 rounded-sm">
                                {item.type === 'package' ? 'MAIN SERVICE' : item.type === 'addon' ? 'ADD-ON SERVICE' : 'CUSTOM SERVICE'}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 text-center border-r border-black font-black">{item.quantity}</td>
                        <td className="py-4 text-center font-black">৳{(item.price * item.quantity).toLocaleString()} /-</td>
                      </tr>
                    ))}
                    
                    {/* Calculation Rows */}
                    <tr className="border-t-2 border-black bg-gray-50">
                      <td colSpan={3} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black">Subtotal Amount</td>
                      <td className="py-2 px-4 text-center font-black text-xs">৳{invoice.subtotal.toLocaleString()} /-</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr className="border-t border-black">
                        <td colSpan={3} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black text-rose-600">Promo Discount</td>
                        <td className="py-2 px-4 text-center font-black text-xs text-rose-600">-৳{invoice.discount.toLocaleString()} /-</td>
                      </tr>
                    )}
                    <tr className="border-t border-black">
                      <td colSpan={3} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black">Service Tax / VAT (8%)</td>
                      <td className="py-2 px-4 text-center font-black text-xs">৳{invoice.tax.toLocaleString()} /-</td>
                    </tr>
                    <tr className="border-t-2 border-black bg-[#1E5F7A] text-white">
                      <td colSpan={3} className="py-3.5 px-4 text-right font-black uppercase text-[12px] border-r border-black">Net Amount Payable</td>
                      <td className="py-3.5 px-4 text-center font-black text-xl">৳{invoice.total.toLocaleString()} /-</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             <div className="grid grid-cols-2 gap-12 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-[#1E5F7A] border-b border-dashed border-[#1E5F7A] w-fit">Billing Details:</h4>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase w-20">Method:</span>
                            <span className="text-xs font-black text-gray-800 uppercase">{invoice.paymentMethod || 'COD / Hand Cash'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase w-20">Status:</span>
                            <Badge className={cn(
                                "text-[9px] font-black uppercase border-none px-3 py-1 rounded-sm shadow-sm",
                                invoice.paymentStatus === 'Paid' ? "bg-green-600 text-white" : "bg-rose-600 text-white"
                            )}>
                                {invoice.paymentStatus}
                            </Badge>
                        </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Info size={14} className="text-[#1E5F7A] mt-0.5" />
                    <p className="text-[8px] font-bold text-blue-900 leading-tight uppercase">
                        Water and electricity must be provided by the client at site. Any extra work beyond scope will be charged additional.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end text-center space-y-4 pb-4">
                   <div className="h-14 w-28 relative opacity-80">
                      <Image src="https://picsum.photos/seed/sig/200/100" alt="Authorized Sign" fill className="object-contain grayscale" unoptimized />
                   </div>
                   <div className="space-y-0.5">
                      <p className="font-black text-xs uppercase text-gray-900">Authorized Officer</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Smart Clean Bangladesh</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Fixed Address Footer Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-16 border-t-2 border-[#1E5F7A] px-12 flex items-center justify-between bg-white">
             <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#1E5F7A]" />
                <p className="text-[10px] font-black text-gray-600 uppercase">GP.Ja-66/2, Wireless Gate, Mohakhali, Dhaka-1212</p>
             </div>
             <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-tighter italic">Clean Life, Smart Life.</p>
          </div>
        </div>

        {/* Support Section for Client */}
        <div className="w-full max-w-[210mm] mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-md bg-white rounded-2xl p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Phone size={20}/></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Helpline</p><p className="font-black text-xs">01919640422</p></div>
            </Card>
            <Card className="border-none shadow-md bg-white rounded-2xl p-6 flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle2 size={20}/></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Trusted by</p><p className="font-black text-xs">5,000+ Clients</p></div>
            </Card>
            <Card className="border-none shadow-md bg-[#081621] text-white rounded-2xl p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/20 text-primary rounded-xl"><Globe size={20}/></div>
                <div><p className="text-[9px] font-black text-white/40 uppercase">Website</p><p className="font-black text-xs">smartclean.com.bd</p></div>
            </Card>
        </div>
      </div>
    </div>
  );
}
