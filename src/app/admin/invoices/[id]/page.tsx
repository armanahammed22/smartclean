
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
  FileEdit
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

  const handleUpdateStatus = async (status: string) => {
    if (!invoiceRef) return;
    await updateDoc(invoiceRef, { 
      paymentStatus: status,
      paidAmount: status === 'Paid' ? invoice?.total : invoice?.paidAmount,
      dueAmount: status === 'Paid' ? 0 : invoice?.total
    });
    toast({ title: "Invoice Updated" });
  };

  const handleApproveRequest = async (request: any) => {
    if (!db || !invoiceRef) return;
    // Logic to merge changes into invoice...
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
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Invoice Control Center</p>
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
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden" id="invoice-render">
            <div className="p-10 md:p-16 space-y-12">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl">SC</div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-[#081621]">Smart Clean BD</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Wireless Gate, Mohakhali, Dhaka</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-primary">INVOICE</h3>
                  <div className="text-[10px] font-black uppercase text-muted-foreground">
                    <p>Serial: {invoice.invoiceNumber}</p>
                    <p>Date: {format(new Date(invoice.createdAt), 'PP')}</p>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-10 border-y border-gray-100 py-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Bill To</p>
                  <div className="space-y-1">
                    <p className="font-black text-lg text-[#081621] uppercase">{invoice.customerInfo.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{invoice.customerInfo.phone}</p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{invoice.customerInfo.address}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Quick Access</p>
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <QRCodeSVG value={invoice.publicLink || ''} size={80} />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-6">
                <div className="grid grid-cols-12 pb-4 border-b-2 border-[#081621] text-[10px] font-black uppercase tracking-widest text-[#081621]">
                  <div className="col-span-7">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                <div className="space-y-4">
                  {invoice.items.map((item: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 text-sm">
                      <div className="col-span-7 space-y-0.5">
                        <p className="font-black text-[#081621] uppercase text-xs">{item.name}</p>
                        <Badge className="bg-gray-100 text-[8px] font-bold text-gray-500 border-none uppercase h-4 px-1.5">{item.type}</Badge>
                      </div>
                      <div className="col-span-2 text-center font-bold text-gray-500">{item.quantity}</div>
                      <div className="col-span-3 text-right font-black text-[#081621]">৳{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end pt-10 border-t-2 border-dashed border-gray-100">
                <div className="w-full max-w-[250px] space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Subtotal</span>
                    <span>৳{invoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Tax (VAT 8%)</span>
                    <span>৳{invoice.tax.toLocaleString()}</span>
                  </div>
                  {invoice.deliveryCharge > 0 && (
                    <div className="flex justify-between text-xs font-bold text-blue-600 uppercase">
                      <span>Charges</span>
                      <span>৳{invoice.deliveryCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-green-600 uppercase">
                      <span>Discount</span>
                      <span>-৳{invoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t-4 border-[#081621] flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-primary">Grand Total</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">৳{invoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-10 flex justify-between items-center opacity-40">
                <p className="text-[8px] font-black uppercase tracking-widest">Authorized Signature</p>
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
                <Wallet size={18} /> Payment Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase opacity-40">Status</p>
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "h-10 px-4 text-xs font-black uppercase border-none",
                    invoice.paymentStatus === 'Paid' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {invoice.paymentStatus}
                  </Badge>
                  {invoice.paymentStatus !== 'Paid' && (
                    <Button size="sm" onClick={() => handleUpdateStatus('Paid')} className="bg-white text-black hover:bg-gray-100 font-black h-10 px-4 rounded-xl">
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase opacity-40">Payment Method</p>
                <p className="text-sm font-bold uppercase">{invoice.paymentMethod || 'Not Specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          {pendingRequests && pendingRequests.length > 0 && (
            <Card className="border-none shadow-lg bg-amber-50 border border-amber-100 rounded-3xl overflow-hidden animate-pulse">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                  <Clock size={16} /> Staff Edit Request
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-white rounded-2xl border border-amber-200 space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">From: {req.staffName}</p>
                    <p className="text-xs italic">"{req.note}"</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveRequest(req)} className="flex-1 bg-amber-600 font-bold text-[10px] h-8 rounded-lg">Approve</Button>
                      <Button size="sm" variant="ghost" className="flex-1 text-amber-700 font-bold text-[10px] h-8 rounded-lg">Ignore</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Integration Links */}
          <div className="p-6 bg-gray-100 rounded-3xl space-y-4 border border-gray-200">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Source Document</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">{invoice.orderId ? 'Product Order' : 'Service Booking'}</span>
              <Button variant="ghost" size="sm" className="h-8 text-primary font-black uppercase text-[9px]" asChild>
                <Link href={invoice.orderId ? '/admin/orders' : '/admin/bookings'}>Open Original</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
