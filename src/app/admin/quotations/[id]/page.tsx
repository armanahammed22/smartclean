'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Wrench,
  Info,
  Calculator,
  Users,
  MapPin,
  Settings2,
  FileSpreadsheet,
  Layers,
  Download,
  Eye,
  ListChecks
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { convertQuotationToBooking, downloadQuotationPDF } from '@/lib/quotation-utils';
import Link from 'next/link';

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const quoteRef = useMemoFirebase(() => (db && id && id !== 'new') ? doc(db, 'quotations', id as string) : null, [db, id]);
  const { data: quote, isLoading: qLoading } = useDoc(quoteRef);

  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const { data: servicesRaw } = useCollection(servicesRef);

  const services = useMemo(() => {
    return servicesRaw?.filter(s => s.status === 'Active').sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  const [customer, setCustomer] = useState<any>({ name: '', phone: '', email: '', company: '', address: '' });
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>({ discount: 0, discountType: 'percentage', additional: 0, vatPercent: 0 });
  const [config, setConfig] = useState<any>({ issueDate: '', expiryDate: '', terms: [] as string[], status: 'Draft', salesPerson: '', footerServices: '' });

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
        terms: Array.isArray(quote.terms) ? quote.terms : [quote.terms || ''], 
        status: quote.status || 'Draft',
        salesPerson: quote.salesPerson || '',
        footerServices: quote.footerServices || ''
      });
    }
  }, [quote]);

  const addItem = () => setItems([...items, { id: 'manual-' + Date.now(), name: '', description: '', price: 0, quantity: 1, unit: 'Qty' }]);
  const removeItem = (itemId: string) => setItems(items.filter(i => i.id !== itemId));
  const updateItem = (itemId: string, field: string, val: any) => {
    setItems(items.map(i => i.id === itemId ? { ...i, [field]: val } : i));
  };

  const addTerm = () => setConfig({ ...config, terms: [...config.terms, ''] });
  const updateTerm = (idx: number, val: string) => {
    const next = [...config.terms];
    next[idx] = val;
    setConfig({ ...config, terms: next });
  };
  const removeTerm = (idx: number) => setConfig({ ...config, terms: config.terms.filter((_, i) => i !== idx) });

  const handleServiceSelect = (serviceId: string, itemIdx: number) => {
    const service = services?.find(s => s.id === serviceId);
    if (service) {
      const nextItems = [...items];
      nextItems[itemIdx] = {
        ...nextItems[itemIdx],
        name: service.title,
        description: service.shortDescription || service.description?.substring(0, 100),
        price: service.basePrice,
        unit: service.pricingType === 'sqft' ? 'Sqft' : 'Unit'
      };
      setItems(nextItems);
    }
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
      await convertQuotationToBooking(db, { ...quote, ...config, customerInfo: customer, items, total: totals.total } as any);
      toast({ title: "Converted to Job", description: "The quote is now an active booking." });
      router.push(`/admin/bookings`);
    } catch (e) {
      toast({ variant: "destructive", title: "Conversion Failed" });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!id) return;
    setIsDownloading(true);
    window.open(`/quotation/view/${id}?download=true`, '_blank');
    setIsDownloading(false);
  };

  if (qLoading) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={48}/><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Protocol...</p></div>;

  return (
    <div className="space-y-8 pb-32 min-w-0 bg-[#FBFBFB] -mt-10 -mx-10 p-10 min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl bg-white shadow-sm border h-12 w-12 hover:bg-gray-50">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><FileSpreadsheet size={16}/></div>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Protocol: MODIFY ESTIMATE</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">{quote?.quoteNumber}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
           <Button variant="outline" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] bg-white border-primary/20 text-primary gap-2 shadow-sm" asChild>
             <Link href={`/quotation/${quote?.quoteNumber}`} target="_blank"><Eye size={16}/> View Portal</Link>
           </Button>
           <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] bg-white border-primary/20 text-indigo-600 gap-2 shadow-sm">
             <Download size={16}/> Download PDF
           </Button>
           {quote?.status === 'Approved' && (
             <Button onClick={handleConvertToBooking} disabled={isConverting} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2 active:scale-95 transition-all">
               {isConverting ? <Loader2 className="animate-spin" size={14} /> : <><ShoppingCart size={18} /> Convert to Job</>}
             </Button>
           )}
           <Button onClick={handleUpdate} disabled={isSaving} className="h-12 px-10 rounded-xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
             {isSaving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={18} /> Update & Sync</>}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <Users size={18} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Client Identity</h3>
            </div>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Legal Name</Label>
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Contact Phone</Label>
                  <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</Label>
                  <Input value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Company / Branch</Label>
                  <Input value={customer.company} onChange={e => setCustomer({...customer, company: e.target.value})} className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Site / Billing Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-primary" size={20} />
                    <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="House, Road, Block, Area..." className="min-h-[100px] pl-12 bg-gray-50 border-none rounded-[2rem] p-6 font-medium shadow-inner focus:bg-white transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <Wrench size={18} className="text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Work Component Matrix</h3>
              </div>
              <Button onClick={addItem} variant="ghost" size="sm" className="h-10 px-6 rounded-xl border-2 border-dashed border-primary/20 text-primary font-black uppercase text-[10px] hover:bg-primary/5">+ Add Component</Button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <Card key={item.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100 group transition-all hover:shadow-md">
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-5 space-y-2">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Link From Catalog</Label>
                         <Select onValueChange={(v) => handleServiceSelect(v, idx)}>
                            <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner">
                               <SelectValue placeholder="Link standard service..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl z-[300]">
                               {services?.map(s => <SelectItem key={s.id} value={s.id} className="py-3 font-bold text-xs uppercase">{s.title}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="md:col-span-6 space-y-2">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Custom Component Label</Label>
                         <Input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="h-12 bg-gray-50 border-none rounded-xl font-black text-xs shadow-inner" />
                      </div>
                      <div className="md:col-span-1 flex justify-center pb-1">
                         <button type="button" onClick={() => removeItem(item.id)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Unit Rate (৳)</Label>
                         <Input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-black text-sm text-primary shadow-inner" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Unit/Area Qty</Label>
                         <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-black text-sm shadow-inner" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Scale/Unit Type</Label>
                         <Select value={item.unit} onValueChange={v => updateItem(item.id, 'unit', v)}>
                           <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase shadow-inner"><SelectValue/></SelectTrigger>
                           <SelectContent className="rounded-xl">
                             {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Total Result</Label>
                         <div className="h-11 bg-gray-100 rounded-xl flex items-center px-4 font-black text-sm text-gray-400 shadow-inner">৳{( (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1) ).toLocaleString()}</div>
                       </div>
                    </div>
                    <Textarea value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Describe technical specifications for this item..." className="bg-gray-50 border-none rounded-2xl min-h-[60px] text-xs font-medium p-4 shadow-inner" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
             <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                   <ListChecks size={18} className="text-amber-500" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Contract Terms & conditions</h3>
                </div>
                <Button type="button" onClick={addTerm} variant="ghost" size="sm" className="h-9 px-4 rounded-xl border border-gray-100 text-[9px] font-black uppercase">+ Add Condition</Button>
             </div>
             <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
               <CardContent className="p-8 space-y-4">
                  {config.terms.map((term: string, i: number) => (
                    <div key={i} className="flex gap-3 group animate-in slide-in-from-top-1">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs text-primary shrink-0 shadow-inner">{i + 1}</div>
                      <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl text-xs font-medium" />
                      <button type="button" onClick={() => removeTerm(i)} className="p-2 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                    </div>
                  ))}
               </CardContent>
             </Card>
          </section>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-10 space-y-8">
           <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden border-t-[12px] border-primary">
             <CardHeader className="p-8 border-b border-white/5 bg-black/10 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Bill Protocol</CardTitle>
                   <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time valuation</p>
                </div>
                <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20"><Calculator size={22}/></div>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-5">
                   <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest">
                     <span>Base Estimate</span>
                     <span>৳{totals.subtotal.toLocaleString()}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6 items-center pt-2">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Discount</Label>
                      <div className="flex gap-2">
                         <Select value={pricing.discountType} onValueChange={(v: any) => setPricing({...pricing, discountType: v})}>
                            <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase w-16"><SelectValue/></SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl z-[500]"><SelectItem value="percentage" className="text-[10px] font-black">%</SelectItem><SelectItem value="fixed" className="text-[10px] font-black">৳</SelectItem></SelectContent>
                         </Select>
                         <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black text-rose-400" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 items-center">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Other Charges</Label>
                      <Input type="number" value={pricing.additional} onChange={e => setPricing({...pricing, additional: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black text-primary" />
                   </div>

                   <div className="grid grid-cols-2 gap-6 items-center pb-6 border-b border-white/5">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">VAT (%)</Label>
                      <Input type="number" value={pricing.vatPercent} onChange={e => setPricing({...pricing, vatPercent: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black" />
                   </div>

                   <div className="pt-8 flex flex-col gap-2">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] leading-none mb-2">Grand Estimated Value</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-6xl font-black tracking-tighter text-primary italic">৳{totals.total.toLocaleString()}</span>
                         <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] uppercase">BDT</Badge>
                      </div>
                   </div>
                </div>

                <div className="space-y-5 pt-8 border-t border-white/5">
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-white/40">Status Protocol</Label>
                     <Select value={config.status} onValueChange={v => setConfig({...config, status: v})}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl font-black uppercase text-xs shadow-inner"><SelectValue/></SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl z-[500]">
                          {['Draft', 'Sent', 'Approved', 'Rejected', 'Expired', 'Converted'].map(s => <SelectItem key={s} value={s} className="font-bold text-[10px] uppercase py-3">{s}</SelectItem>)}
                        </SelectContent>
                     </Select>
                   </div>
                   <Button 
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="w-full h-16 md:h-20 rounded-[2.5rem] bg-primary hover:bg-[#15435a] font-black text-2xl uppercase tracking-tight shadow-xl shadow-primary/20 gap-4 active:scale-95 transition-all"
                   >
                     {isSaving ? <Loader2 className="animate-spin h-8 w-8" /> : <><Save size={28} /> Synchronize Record</>}
                   </Button>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8 border border-gray-100 space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><Settings2 size={24}/></div>
                 <h4 className="text-base font-black uppercase tracking-tight text-[#081621]">Validation Control</h4>
              </div>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-gray-400 uppercase ml-1">Issue Date</Label>
                       <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-gray-400 uppercase ml-1">Expiry Date</Label>
                       <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Sales Agent</Label>
                    <Input value={config.salesPerson} onChange={e => setConfig({...config, salesPerson: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
