'use client';

import React, { useState, useEffect } from 'react';
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
  Printer,
  Wallet,
  CheckCircle2,
  XCircle,
  Zap,
  MessageCircle,
  History,
  FileText,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { downloadInvoicePDF } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const handleUpdateStatus = async (status: string) => {
    if (!invoiceRef || !invoice) return;
    try {
      await updateDoc(invoiceRef, { 
        paymentStatus: status,
        paidAmount: status === 'Paid' ? invoice.total : 0,
        dueAmount: status === 'Paid' ? 0 : invoice.total
      });
      toast({ title: "Invoice Status Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const shareWhatsApp = () => {
    if (!invoice) return;
    const text = `Hi ${invoice.customerInfo.name}, your invoice ${invoice.invoiceNumber} for ${invoice.total} BDT is ready. View here: ${invoice.publicLink}`;
    window.open(`https://wa.me/${invoice.customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;
  if (!invoice) return <div className="p-20 text-center uppercase font-black opacity-20">Secure Invoice Not Found</div>;

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Official Document Terminal</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11 px-6 rounded-xl" onClick={shareWhatsApp}>
            <MessageCircle size={18} className="text-green-600" /> Share via WhatsApp
          </Button>
          <Button 
            className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 bg-[#1E5F7A] hover:bg-[#15435a]" 
            onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render-area', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={18} />} DOWNLOAD PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 📄 CORPORATE INVOICE RENDER AREA */}
        <div className="lg:col-span-8">
          <div 
            id="invoice-render-area" 
            className="bg-white shadow-2xl overflow-hidden relative mx-auto"
            style={{ width: '210mm', minHeight: '297mm', color: '#333' }}
          >
            {/* Design Header Waves */}
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

               {/* Wave Decoration */}
               <div className="absolute top-24 left-0 right-0 h-12 pointer-events-none opacity-20">
                  <svg viewBox="0 0 1440 320" className="w-full h-full"><path fill="#22C55E" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>
               </div>
            </div>

            <div className="px-16 pt-16 space-y-12">
               <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-[#1E5F7A] uppercase tracking-widest">Billed To:</p>
                    <div className="space-y-0.5">
                        <p className="text-lg font-black text-[#081621] uppercase leading-none">{invoice.customerInfo.name}</p>
                        <p className="text-xs font-bold text-gray-700">{invoice.customerInfo.phone}</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[250px]">{invoice.customerInfo.address}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-[#1E5F7A] uppercase">Invoice Number</p>
                        <p className="text-sm font-black text-[#081621]">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-[#1E5F7A] uppercase">Date of Issue</p>
                        <p className="text-sm font-black text-[#081621]">{format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
               </div>

               <div className="text-center">
                  <h3 className="text-xl font-black uppercase text-[#1E5F7A] border-b-2 border-[#1E5F7A] inline-block pb-1 tracking-tight">
                    {invoice.projectId ? 'OFFICIAL SERVICE QUOTATION' : 'OFFICIAL SALES INVOICE'}
                  </h3>
               </div>

               {/* Professional Optimized Table */}
               <div className="overflow-hidden border-2 border-black rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#00A8B5] text-white">
                      <tr>
                        <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase w-12 text-center">SL.</th>
                        <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase text-left">Service Description</th>
                        <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase text-center w-24">Qty</th>
                        <th className="py-2 px-3 text-[10px] font-black border-r border-black uppercase text-center w-28">Rate (BDT)</th>
                        <th className="py-2 px-3 text-[10px] font-black uppercase text-center w-28">Amount (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium">
                      {invoice.items.map((item: any, i: number) => (
                        <tr key={i} className="border-t border-black">
                          <td className="py-4 text-center border-r border-black font-black">{i + 1}</td>
                          <td className="py-4 px-3 border-r border-black font-black uppercase">
                            <span>{item.name}</span>
                          </td>
                          <td className="py-4 text-center border-r border-black font-black uppercase">
                            {item.quantity} {item.unit || (item.type === 'service' || item.type === 'addon' ? 'Pcs' : 'Qty')}
                          </td>
                          <td className="py-4 text-center border-r border-black font-black">
                            ৳{item.price?.toLocaleString()}
                          </td>
                          <td className="py-4 text-center font-black">
                            ৳{(item.price * item.quantity).toLocaleString()}/-
                          </td>
                        </tr>
                      ))}
                      
                      {/* Pricing Calculation Section */}
                      <tr className="border-t-2 border-black bg-gray-50">
                        <td colSpan={4} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black">Subtotal</td>
                        <td className="py-2 px-4 text-center font-black text-xs">৳{invoice.subtotal.toLocaleString()} /-</td>
                      </tr>
                      {invoice.discount > 0 && (
                        <tr className="border-t border-black">
                          <td colSpan={4} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black text-rose-600">Discount</td>
                          <td className="py-2 px-4 text-center font-black text-xs text-rose-600">-৳{invoice.discount.toLocaleString()} /-</td>
                        </tr>
                      )}
                      <tr className="border-t border-black">
                        <td colSpan={4} className="py-2 px-4 text-right font-black uppercase text-[10px] border-r border-black">Tax / VAT</td>
                        <td className="py-2 px-4 text-center font-black text-xs">৳{invoice.tax.toLocaleString()} /-</td>
                      </tr>
                      <tr className="border-t-2 border-black bg-[#1E5F7A] text-white">
                        <td colSpan={4} className="py-3 px-4 text-right font-black uppercase text-[12px] border-r border-black">Grand Total Payable</td>
                        <td className="py-3 px-4 text-center font-black text-lg">৳{invoice.total.toLocaleString()} /-</td>
                      </tr>
                    </tbody>
                  </table>
               </div>

               {/* Payment Info Section */}
               <div className="grid grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase text-[#1E5F7A] border-b border-dashed border-[#1E5F7A] w-fit mb-2">Payment Info:</h4>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase w-20">Method:</span>
                                <span className="text-xs font-black text-gray-800 uppercase">{invoice.paymentMethod || 'Cash / Online'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase w-20">Status:</span>
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase border-none px-2 h-5",
                                    invoice.paymentStatus === 'Paid' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                )}>
                                    {invoice.paymentStatus}
                                </Badge>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                     <div className="h-16 w-32 relative mx-auto opacity-80">
                        <Image src="https://picsum.photos/seed/sig/200/100" alt="Authorized Signature" fill className="object-contain grayscale" unoptimized />
                     </div>
                     <div className="space-y-0.5">
                        <p className="font-black text-sm uppercase">Authorized Signature</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Smart Clean Bangladesh</p>
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <Info size={16} className="text-[#1E5F7A] shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-blue-900 leading-normal uppercase">
                        This is a system generated document. For any query regarding this invoice, please contact our support team at 01919640422.
                    </p>
                  </div>
               </div>
            </div>

            {/* Bottom Address Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-16 border-t-2 border-[#1E5F7A] px-12 flex items-center justify-between bg-white">
               <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#1E5F7A]" />
                  <p className="text-[10px] font-black text-gray-600 uppercase">GP.Ja-66/2, Wireless Gate, Mohakhali, Dhaka-1212</p>
               </div>
               <p className="text-[10px] font-black text-[#1E5F7A] uppercase tracking-tighter italic">Clean Life, Smart Life.</p>
            </div>
          </div>
        </div>

        {/* 🛠️ MANAGEMENT SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Wallet size={18} /> Payout Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase opacity-40">Current Payment Status</p>
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "h-10 px-4 text-xs font-black uppercase border-none",
                    invoice.paymentStatus === 'Paid' ? "bg-green-50 text-white" : "bg-red-50 text-white"
                  )}>
                    {invoice.paymentStatus}
                  </Badge>
                  {invoice.paymentStatus !== 'Paid' && (
                    <Button size="sm" onClick={() => handleUpdateStatus('Paid')} className="bg-white text-[#081621] hover:bg-gray-100 font-black h-10 px-4 rounded-xl uppercase text-[10px]">
                      Mark as Paid
                    </Button>
                  )}
                  {invoice.paymentStatus === 'Paid' && (
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus('Unpaid')} className="text-rose-400 hover:text-rose-300 font-black uppercase text-[10px]">
                      Revert
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-60">
                    <span>Subtotal:</span>
                    <span>৳{invoice.subtotal.toLocaleString()}</span>
                 </div>
                 {invoice.discount > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-rose-400">
                        <span>Discount:</span>
                        <span>-৳{invoice.discount.toLocaleString()}</span>
                    </div>
                 )}
                 <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-60">
                    <span>Tax (VAT):</span>
                    <span>৳{invoice.tax.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-black uppercase text-primary border-t border-white/5 pt-4">
                    <span>Net Payable:</span>
                    <span>৳{invoice.total.toLocaleString()}</span>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-6 border-b flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase">Document History</CardTitle>
                <History size={16} className="text-primary"/>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CalendarIcon size={14}/></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase">Created On</p><p className="text-xs font-bold">{format(new Date(invoice.createdAt), 'PP p')}</p></div>
                </div>
                {invoice.updatedAt && (
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Zap size={14}/></div>
                       <div><p className="text-[10px] font-black text-gray-400 uppercase">Last Activity</p><p className="text-xs font-bold">{format(new Date(invoice.updatedAt), 'PP p')}</p></div>
                   </div>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
