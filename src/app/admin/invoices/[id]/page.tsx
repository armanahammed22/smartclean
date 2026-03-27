
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  User, 
  MapPin, 
  Phone, 
  Wallet,
  Zap,
  MoreVertical,
  MessageCircle,
  FileEdit,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { downloadInvoicePDF } from '@/lib/invoice-utils';
import { cn } from '@/lib/utils';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const requestsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'invoiceRequests'), where('invoiceId', '==', id), where('status', '==', 'Pending')) : null, [db, id]);
  const { data: pendingRequests } = useCollection(requestsQuery);

  // Auto-download if triggered from list
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('download') === 'true' && invoice && !isDownloading) {
      const timer = setTimeout(() => {
        setIsDownloading(true);
        downloadInvoicePDF('invoice-render', invoice.invoiceNumber).finally(() => setIsDownloading(false));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [invoice, isDownloading]);

  const handleUpdateStatus = async (status: string) => {
    if (!invoiceRef) return;
    await updateDoc(invoiceRef, { 
      paymentStatus: status,
      paidAmount: status === 'Paid' ? (invoice?.total || 0) : 0,
      dueAmount: status === 'Paid' ? 0 : (invoice?.total || 0)
    });
    toast({ title: "Invoice Updated" });
  };

  const handleApproveRequest = async (request: any) => {
    if (!db || !invoiceRef) return;
    await updateDoc(doc(db, 'invoiceRequests', request.id), { status: 'Approved' });
    toast({ title: "Request Approved" });
  };

  const shareWhatsApp = () => {
    if (!invoice) return;
    const text = `Hi ${invoice.customerInfo.name}, your invoice ${invoice.invoiceNumber} for ${invoice.total} BDT is ready. View here: ${invoice.publicLink}`;
    window.open(`https://wa.me/${invoice.customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;
  if (!invoice) return <div className="p-20 text-center uppercase font-black opacity-20">Invoice Not Found</div>;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Internal Billing Control</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11" onClick={shareWhatsApp}>
            <MessageCircle size={18} className="text-green-600" /> WhatsApp
          </Button>
          <Button 
            className="gap-2 font-black h-11 px-6 shadow-xl shadow-primary/20" 
            onClick={() => { setIsDownloading(true); downloadInvoicePDF('invoice-render', invoice.invoiceNumber).finally(() => setIsDownloading(false)); }}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={18} />} PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Invoice Preview */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden" id="invoice-render">
            <div className="p-10 md:p-16 space-y-12">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-[#081621] rounded-2xl flex items-center justify-center text-white font-black text-2xl border-4 border-primary/20">SC</div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-[#081621]">Smart Clean BD</h2>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Premium Service Provider</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-primary italic">INVOICE</h3>
                  <div className="text-[10px] font-black uppercase text-muted-foreground space-y-0.5">
                    <p>SERIAL: {invoice.invoiceNumber}</p>
                    <p>DATE: {format(new Date(invoice.createdAt), 'PP')}</p>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-10 border-y border-gray-100 py-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Bill To</p>
                  <div className="space-y-1">
                    <p className="font-black text-lg text-[#081621] uppercase leading-none">{invoice.customerInfo.name}</p>
                    <p className="text-xs text-muted-foreground font-bold">{invoice.customerInfo.phone}</p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px]">{invoice.customerInfo.address}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Public Link</p>
                  <div className="p-2 bg-white rounded-xl border-2 border-gray-50 shadow-inner">
                    <QRCodeSVG value={invoice.publicLink || ''} size={80} />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-6">
                <div className="grid grid-cols-12 pb-4 border-b-2 border-[#081621] text-[10px] font-black uppercase tracking-widest text-[#081621]">
                  <div className="col-span-7">Service / Item Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                <div className="space-y-4">
                  {invoice.items.map((item: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 text-sm items-center">
                      <div className="col-span-7 space-y-0.5">
                        <p className="font-black text-[#081621] uppercase text-xs">{item.name}</p>
                        <Badge className="bg-gray-100 text-[8px] font-bold text-gray-500 border-none uppercase h-4 px-1.5">{item.type}</Badge>
                      </div>
                      <div className="col-span-2 text-center font-bold text-gray-400">{item.quantity}</div>
                      <div className="col-span-3 text-right font-black text-[#081621]">৳{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end pt-10 border-t-2 border-dashed border-gray-100">
                <div className="w-full max-w-[280px] space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-gray-900">৳{invoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Tax (VAT 8%)</span>
                    <span className="text-gray-900">৳{invoice.tax.toLocaleString()}</span>
                  </div>
                  {invoice.deliveryCharge > 0 && (
                    <div className="flex justify-between text-xs font-bold text-blue-600 uppercase tracking-widest">
                      <span>Charges</span>
                      <span>৳{invoice.deliveryCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-green-600 uppercase tracking-widest">
                      <span>Discount</span>
                      <span>-৳{invoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t-4 border-[#081621] flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Grand Total</span>
                    <span className="text-4xl font-black text-primary tracking-tighter">৳{invoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-16 flex justify-between items-center border-t border-gray-50 opacity-40">
                <div className="space-y-1">
                  <div className="w-32 h-px bg-gray-900" />
                  <p className="text-[8px] font-black uppercase tracking-widest">Authorized Signature</p>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest">© 2026 Smart Clean Bangladesh</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Payment Control */}
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Wallet size={18} /> Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase opacity-40">Current Status</p>
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "h-10 px-4 text-xs font-black uppercase border-none",
                    invoice.paymentStatus === 'Paid' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {invoice.paymentStatus}
                  </Badge>
                  {invoice.paymentStatus !== 'Paid' && (
                    <Button size="sm" onClick={() => handleUpdateStatus('Paid')} className="bg-white text-[#081621] hover:bg-gray-100 font-black h-10 px-4 rounded-xl uppercase text-[10px]">
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase opacity-40">Payment Gateway</p>
                <p className="text-sm font-black uppercase tracking-tight">{invoice.paymentMethod || 'Not Specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          {pendingRequests && pendingRequests.length > 0 && (
            <Card className="border-none shadow-lg bg-amber-50 border border-amber-100 rounded-3xl overflow-hidden animate-in fade-in">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                  <FileEdit size={16} /> Staff Edit Request
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-white rounded-2xl border border-amber-200 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-700">{req.staffName?.[0]}</div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{req.staffName}</p>
                    </div>
                    <p className="text-xs italic text-gray-600 font-medium">"{req.note}"</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveRequest(req)} className="flex-1 bg-amber-600 font-black text-[9px] h-8 rounded-lg uppercase">Approve</Button>
                      <Button size="sm" variant="ghost" className="flex-1 text-amber-700 font-bold text-[9px] h-8 rounded-lg uppercase">Ignore</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Integration Links */}
          <div className="p-6 bg-white rounded-3xl space-y-4 border border-gray-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Source Context</h4>
            <div className="flex items-center justify-between">
              <Badge className="bg-gray-100 text-gray-600 border-none font-bold text-[9px] uppercase">{invoice.orderId ? 'E-commerce Order' : 'Booking'}</Badge>
              <Button variant="link" size="sm" className="h-8 text-primary font-black uppercase text-[9px] px-0" asChild>
                <Link href={invoice.orderId ? '/admin/orders' : '/admin/bookings'}>View Original <ArrowRight size={10} className="ml-1" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
