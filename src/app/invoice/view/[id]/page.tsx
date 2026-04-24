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
  Wallet,
  Zap,
  Printer
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

  if (!mounted || isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center p-8 text-center uppercase font-black opacity-20">Secure Document Not Found</div>;

  const signatureUrl = settings?.signatureUrl;
  const logoUrl = settings?.logoUrl || "https://picsum.photos/seed/smartclean-logo/512/512";

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-8 md:py-16 selection:bg-primary selection:text-white">
      <div className="container mx-auto px-4 flex flex-col items-center">
        
        <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#081621] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border border-white/10">SC</div>
            <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#081621] block">Secure Billing Link</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1">Legally Verified</Badge>
            </div>
          </div>
          <div className="flex gap-3">
             <Button 
                className="rounded-xl gap-2 font-black uppercase text-[10px] h-12 px-10 bg-[#1E5F7A] text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                onClick={() => { setIsDownloading(true); downloadInvoicePDF('public-invoice-render', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
                disabled={isDownloading}
              >
                {isDownloading ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={16} />} DOWNLOAD AS PDF
              </Button>
          </div>
        </div>

        {/* 📄 CORPORATE INVOICE RENDER AREA */}
        <div 
          id="public-invoice-render" 
          className="bg-white shadow-2xl relative border-t-[15px] border-[#1E5F7A]"
          style={{ width: '210mm', minHeight: '297mm', color: '#333' }}
        >
          {/* Company Meta */}
          <div className="absolute top-0 right-0 p-10 flex flex-col items-end gap-1.5 z-10 text-[9px] font-black text-[#1E5F7A] uppercase tracking-widest">
            <div className="flex items-center gap-2 bg-gray-50/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/10 shadow-sm"><Phone size={11}/> {settings?.contactPhone}</div>
            <div className="flex items-center gap-2 bg-gray-50/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/10 shadow-sm"><Mail size={11}/> {settings?.contactEmail}</div>
            <div className="flex items-center gap-2 bg-gray-50/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/10 shadow-sm"><Globe size={11}/> smartclean.com.bd</div>
          </div>

          <div className="pt-10 px-16 relative">
             <div className="flex items-start gap-5 mb-12">
                <div className="w-20 h-20 relative bg-white rounded-2xl shadow-sm border p-1 overflow-hidden">
                   <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                </div>
                <div className="pt-2">
                  <h2 className="text-3xl font-black text-[#1E5F7A] tracking-tighter italic leading-none">{settings?.websiteName || 'Smart Clean'}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Premium Maintenance Experts</p>
                </div>
             </div>
             
             <div className="absolute top-24 left-0 right-0 h-40 pointer-events-none opacity-[0.04]">
                <svg viewBox="0 0 1440 320" className="w-full h-full"><path fill="#1E5F7A" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>
             </div>
          </div>

          <div className="px-16 pt-10 space-y-12 relative z-10">
             <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-[0.2em] border-b border-primary/20 pb-1 w-fit">Client Details:</p>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-[#081621] uppercase leading-tight">{invoice.customerInfo.name}</p>
                    <p className="text-xs font-bold text-gray-700 flex items-center gap-2"><Phone size={11} className="text-primary"/> {invoice.customerInfo.phone}</p>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[320px] flex items-start gap-2 mt-2">
                       <MapPin size={11} className="text-primary mt-1 shrink-0"/> {invoice.customerInfo.address}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-widest">Tracking Number</p>
                    <p className="text-lg font-black text-[#081621] font-mono tracking-tight">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-widest">Date of Issue</p>
                    <p className="text-sm font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                  </div>
                </div>
             </div>

             <div className="text-center py-4 border-y-2 border-[#1E5F7A] bg-[#1E5F7A]/5 rounded-xl">
                <h3 className="text-xl font-black uppercase text-[#1E5F7A] tracking-[0.2em]">
                  {invoice.projectId ? 'SERVICE QUOTATION DOCUMENT' : 'OFFICIAL SALES INVOICE'}
                </h3>
             </div>

             <div className="overflow-hidden border-2 border-[#081621] rounded-2xl shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-[#00A8B5] text-white">
                    <tr>
                      <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase w-12 text-center">SL.</th>
                      <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase text-left">Scope of Work</th>
                      <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase text-center w-24">Qty/Unit</th>
                      <th className="py-4 px-4 text-[10px] font-black border-r border-[#081621] uppercase text-center w-28">Rate (৳)</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase text-center w-32">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-medium bg-white">
                    {invoice.items.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-[#081621]">
                        <td className="py-4 text-center border-r border-[#081621] font-black text-gray-400">{i + 1}</td>
                        <td className="py-4 px-4 border-r border-[#081621] font-black uppercase text-gray-800">{item.name}</td>
                        <td className="py-4 text-center border-r border-[#081621] font-black text-gray-700">{item.quantity} <span className="text-[8px] uppercase opacity-50">{item.unit || 'Qty'}</span></td>
                        <td className="py-4 text-center border-r border-[#081621] font-black text-gray-700">{item.price?.toLocaleString()}</td>
                        <td className="py-4 text-center font-black text-gray-900 bg-gray-50/20">{(item.price * item.quantity).toLocaleString()}/-</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#081621] bg-gray-50/80">
                      <td colSpan={4} className="py-3 px-6 text-right font-black uppercase text-[10px] border-r border-[#081621]">Gross Amount</td>
                      <td className="py-3 px-4 text-center font-black text-sm">৳{invoice.subtotal.toLocaleString()}</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr className="border-t border-[#081621] bg-white">
                        <td colSpan={4} className="py-3 px-6 text-right font-black uppercase text-[10px] border-r border-[#081621] text-rose-600">Promo Savings (-)</td>
                        <td className="py-3 px-4 text-center font-black text-sm text-rose-600">৳{invoice.discount.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.deliveryCharge > 0 && (
                      <tr className="border-t border-[#081621] bg-white">
                        <td colSpan={4} className="py-3 px-6 text-right font-black uppercase text-[10px] border-r border-[#081621]">Logistics / Extra (+)</td>
                        <td className="py-3 px-4 text-center font-black text-sm">৳{invoice.deliveryCharge.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-[#081621] bg-[#1E5F7A] text-white shadow-inner">
                      <td colSpan={4} className="py-5 px-6 text-right font-black uppercase text-[14px] border-r border-white/20 tracking-widest italic">Net Amount Payable</td>
                      <td className="py-5 px-4 text-center font-black text-2xl tracking-tighter shadow-lg">৳{invoice.total.toLocaleString()} /-</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             <div className="p-6 bg-[#1E5F7A]/5 rounded-2xl border-2 border-[#081621] space-y-1">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Total Amount In Words:</p>
                <p className="text-sm font-black text-[#081621] italic tracking-tight">" {numberToWords(invoice.total)} "</p>
             </div>

             <div className="grid grid-cols-2 gap-12 pt-4 items-start">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-[#1E5F7A] tracking-widest border-b border-dashed border-[#1E5F7A] w-fit mb-2">Billing Memo:</h4>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase w-20">Method:</span>
                            <span className="text-xs font-black text-gray-800 uppercase">{invoice.paymentMethod || 'COD / Hand Cash'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase w-20">Status:</span>
                            <Badge className={cn(
                                "text-[9px] font-black uppercase border-none px-3 py-1 rounded-sm shadow-sm",
                                invoice.paymentStatus === 'Paid' ? "bg-green-600 text-white" : "bg-red-600 text-white"
                            )}>
                                {invoice.paymentStatus}
                            </Badge>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end text-center space-y-5 pb-4">
                   <div className="h-16 w-32 relative border-b-2 border-gray-100 pb-2 flex items-center justify-center">
                      {signatureUrl ? (
                        <Image src={signatureUrl} alt="Sign" fill className="object-contain" unoptimized />
                      ) : (
                        <div className="text-[9px] font-black text-gray-200 border-2 border-dashed p-4 uppercase tracking-tighter">Authorized Signature</div>
                      )}
                   </div>
                   <div>
                      <p className="font-black text-xs uppercase text-[#081621] tracking-tighter">Chief Operational Officer</p>
                      <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Smart Clean Bangladesh</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 border-t-4 border-[#1E5F7A] px-16 flex items-center justify-between bg-white">
             <div className="flex items-center gap-4">
                <div className="p-2 bg-primary text-white rounded-xl shadow-lg"><MapPin size={16} /></div>
                <div>
                   <p className="text-[10px] font-black text-gray-800 uppercase leading-none mb-1">Business Center</p>
                   <p className="text-[9px] font-bold text-gray-500 uppercase leading-none">{settings?.address || 'Mohakhali, Dhaka-1212'}</p>
                </div>
             </div>
             <p className="text-[11px] font-black text-[#1E5F7A] uppercase tracking-[0.3em] italic">Clean Life, Smart Life.</p>
          </div>
        </div>

        <div className="w-full max-w-[210mm] mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer group">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Phone size={22}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Helpdesk</p><p className="font-black text-sm">{settings?.contactPhone}</p></div>
            </Card>
            <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer group">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><CheckCircle2 size={22}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Certified Brand</p><p className="font-black text-sm">Professional Team</p></div>
            </Card>
            <Card className="border-none shadow-xl bg-[#081621] text-white rounded-3xl p-6 flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer group">
                <div className="p-3 bg-primary/20 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all"><Globe size={22}/></div>
                <div><p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Live Updates</p><p className="font-black text-sm">smartclean.com.bd</p></div>
            </Card>
        </div>
      </div>
    </div>
  );
}
