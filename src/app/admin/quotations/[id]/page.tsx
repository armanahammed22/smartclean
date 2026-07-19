
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, orderBy, deleteDoc, setDoc, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Zap, 
  FileText, 
  CheckCircle2, 
  ShoppingCart,
  X,
  Search,
  Check,
  Wrench,
  Info,
  Calendar,
  Calculator,
  User,
  Building2,
  Layers,
  ArrowRight,
  ExternalLink,
  Printer,
  Smartphone,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { convertQuotationToBooking } from '@/lib/quotation-utils';

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const quoteRef = useMemoFirebase(() => (db && id) ? doc(db, 'quotations', id as string) : null, [db, id]);
  const { data: quote, isLoading: qLoading } = useDoc(quoteRef);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const clientsQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer')) : null, [db]);

  const { data: services } = useCollection(servicesQuery);
  const { data: clients } = useCollection(clientsQuery);

  const [customer, setCustomer] = useState<any>({ name: '', phone: '', email: '', company: '', address: '' });
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>({ discount: 0, discountType: 'percentage', additional: 0, vatPercent: 0 });
  const [config, setConfig] = useState<any>({ issueDate: '', expiryDate: '', terms: '', status: 'Draft' });

  useEffect(() => {
    if (quote) {
      setCustomer(quote.customerInfo || {});
      setItems(quote.items || []);
      setPricing({ 
        discount: quote.discount || 0, 
        discountType: quote.discountType || 'percentage', 
        additional: quote.additionalCharges || 0, 
        vatPercent: quote.vatPercent || 0 
      });
      setConfig({ 
        issueDate: quote.issueDate || '', 
        expiryDate: quote.expiryDate || '', 
        terms: quote.terms || '', 
        status: quote.status || 'Draft',
        salesPerson: quote.salesPerson || ''
      });
    }
  }, [quote]);

  const addItem = () => setItems([...items, { id: 'manual-' + Date.now(), name: '', description: '', price: 0, quantity: 1, unit: 'Qty' }]);
  const removeItem = (itemId: string) => setItems(items.filter(i => i.id !== itemId));
  const updateItem = (itemId: string, field: string, val: any) => {
    setItems(items.map(i => i.id === itemId ? { ...i, [field]: val } : i));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 1), 0);
    let discountAmt = pricing.discountType === 'percentage' ? (subtotal * (pricing.discount / 100)) : pricing.discount;
    const net = subtotal - discountAmt;
    const taxAmt = net * (pricing.vatPercent / 100);
    const total = net + taxAmt + (pricing.additional || 0);
    return { subtotal, discountAmt, taxAmt, total };
  }, [items, pricing]);

  const handleUpdate = async () => {
    if (!db || !quoteRef) return;
    setIsSaving(true);
    try {
      await updateDoc(quoteRef, {
        customerInfo: customer,
        items,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        additionalCharges: pricing.additional,
        vatPercent: pricing.vatPercent,
        tax: totals.taxAmt,
        total: totals.total,
        ...config,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Quotation Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToBooking = async () => {
    if (!db || !quote) return;
    setIsConverting(true);
    try {
      const bookingId = await convertQuotationToBooking(db, { ...quote, ...config, customerInfo: customer, items, total: totals.total } as any);
      toast({ title: "Converted to Booking", description: "The estimate is now a scheduled job." });
      router.push(`/admin/bookings`);
    } catch (e) {
      toast({ variant: "destructive", title: "Conversion Failed" });
    } finally {
      setIsConverting(false);
    }
  };

  if (qLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-32 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/quotations')} className="rounded-full bg-white shadow-sm border h-10 w-10"><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none italic">{quote?.quoteNumber}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Management Protocol Active</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[10px] bg-white border-primary/20 text-primary gap-2" asChild>
             <Link href={`/quotation/view/${id}`} target="_blank"><ExternalLink size={16}/> Public View</Link>
           </Button>
           {quote?.status === 'Approved' && (
             <Button onClick={handleConvertToBooking} disabled={isConverting} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2">
               {isConverting ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={18} /> Convert to Booking</>}
             </Button>
           )}
           <Button onClick={handleUpdate} disabled={isSaving} className="rounded-xl h-12 px-10 font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2">
             {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Sync Changes</>}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8 space-y-10">
          
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><User size={18} className="text-primary"/> Client Identity</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Legal Name</Label>
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contact Phone</Label>
                  <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Site / Billing Address</Label>
                <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="min-h-[80px] bg-gray-50 border-none rounded-2xl p-4 shadow-inner" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Work Component Matrix</CardTitle>
              </div>
              <Button onClick={addItem} variant="ghost" size="sm" className="h-9 px-4 rounded-xl border-2 border-dashed border-primary/20 text-primary font-black uppercase text-[10px]">+ Add Item</Button>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               {items.map((item, idx) => (
                  <div key={item.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5"><Input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="h-10 border-none bg-white font-bold text-xs rounded-lg" /></div>
                    <div className="md:col-span-2"><Input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="h-10 border-none bg-white font-black text-xs text-primary" /></div>
                    <div className="md:col-span-2"><Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-10 border-none bg-white font-black text-xs" /></div>
                    <div className="md:col-span-2"><Input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="h-10 border-none bg-white font-bold text-[10px] uppercase" /></div>
                    <div className="md:col-span-1 flex justify-center"><button onClick={() => removeItem(item.id)} className="text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button></div>
                  </div>
               ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b border-white/5 bg-black/10 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">Bill Protocol</CardTitle>
                   <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">NET QUOTATION VALUE</p>
                </div>
                <div className="p-3 bg-primary rounded-2xl shadow-xl"><Calculator size={20}/></div>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                   <div className="flex justify-between text-xs font-bold text-white/40 uppercase"><span>Subtotal</span><span>৳{totals.subtotal.toLocaleString()}</span></div>
                   <div className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-[9px] font-black uppercase text-white/40">Discount</Label>
                      <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black text-rose-400" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-[9px] font-black uppercase text-white/40">VAT (%)</Label>
                      <Input type="number" value={pricing.vatPercent} onChange={e => setPricing({...pricing, vatPercent: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black" />
                   </div>
                   <div className="pt-6 border-t border-white/10 flex flex-col gap-1">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Estimated Total</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-black tracking-tighter text-primary italic">৳{totals.total.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-white/40">Status Protocol</Label>
                     <Select value={config.status} onValueChange={v => setConfig({...config, status: v})}>
                        <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl font-black uppercase text-[10px]"><SelectValue/></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {['Draft', 'Sent', 'Approved', 'Rejected', 'Expired', 'Converted'].map(s => <SelectItem key={s} value={s} className="font-bold text-[10px] uppercase">{s}</SelectItem>)}
                        </SelectContent>
                     </Select>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-white rounded-3xl p-8 border border-gray-100 space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Clock size={14}/> Timing Control</h4>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                   <Label className="text-[9px] font-black text-gray-400 uppercase">Expiry Date</Label>
                   <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold" />
                 </div>
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                   <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                   <p className="text-[9px] font-bold text-blue-800 leading-relaxed uppercase">কোটিশন এপ্রুভ হওয়ার পর আপনি এটি সরাসরি বুকিং-এ কনভার্ট করতে পারবেন।</p>
                 </div>
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
