
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, where, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  FileText, 
  User, 
  MapPin, 
  Wrench, 
  Zap,
  CheckCircle2,
  Calendar,
  Calculator,
  PlusCircle,
  Settings2,
  Briefcase,
  Users,
  Smartphone,
  Check,
  ShieldCheck,
  Wallet,
  Building2,
  Layers,
  ChevronRight,
  Info,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNextQuotationNumber } from '@/lib/quotation-utils';
import Link from 'next/link';

export default function CreateQuotationPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('...');

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', email: '', company: '', address: '' });
  const [items, setItems] = useState<any[]>([{ id: 'manual-' + Date.now(), name: '', description: '', price: '', quantity: 1, unit: 'Qty' }]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', additional: 0, vatPercent: 0 });
  const [config, setConfig] = useState({ issueDate: new Date().toISOString().split('T')[0], expiryDate: '', terms: '', salesPerson: user?.displayName || '' });

  // Data Fetch
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), orderBy('title', 'asc')) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer')) : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);

  const { data: services } = useCollection(servicesQuery);
  const { data: clients } = useCollection(customersQuery);
  const { data: quoteSettings } = useDoc(settingsRef);

  useEffect(() => {
    if (db) {
      getNextQuotationNumber(db).then(setQuoteNumber);
    }
  }, [db]);

  useEffect(() => {
    if (quoteSettings) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (quoteSettings.defaultValidityDays || 7));
      setConfig(prev => ({ 
        ...prev, 
        expiryDate: expiry.toISOString().split('T')[0],
        terms: quoteSettings.defaultTerms || '',
        salesPerson: user?.displayName || ''
      }));
    }
  }, [quoteSettings, user]);

  const addItem = () => setItems([...items, { id: 'manual-' + Date.now(), name: '', description: '', price: '', quantity: 1, unit: 'Qty' }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, val: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      setCustomer({
        id: client.id,
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        company: client.company || '',
        address: client.address || ''
      });
    }
  };

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
    const itemTotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 1), 0);
    const addOnTotal = addOns.reduce((acc, a) => acc + (parseFloat(a.price) || 0) * (parseFloat(a.quantity) || 1), 0);
    const subtotal = itemTotal + addOnTotal;
    
    let discountAmt = pricing.discountType === 'percentage' 
      ? (subtotal * (pricing.discount / 100)) 
      : pricing.discount;
      
    const netAfterDiscount = subtotal - discountAmt;
    const taxAmt = (netAfterDiscount * (pricing.vatPercent / 100));
    const total = netAfterDiscount + taxAmt + (pricing.additional || 0);

    return { subtotal, discountAmt, taxAmt, total };
  }, [items, addOns, pricing]);

  const handleSave = async (status: string) => {
    if (!db) return;
    if (!customer.name || items.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Customer name and at least one item are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = {
        quoteNumber,
        customerId: customer.id || null,
        customerInfo: customer,
        items: items.map(i => ({ ...i, price: parseFloat(i.price) || 0, quantity: parseFloat(i.quantity) || 1 })),
        addOns: addOns.map(a => ({ ...a, price: parseFloat(a.price) || 0, quantity: parseFloat(a.quantity) || 1 })),
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        additionalCharges: pricing.additional,
        vatPercent: pricing.vatPercent,
        tax: totals.taxAmt,
        total: totals.total,
        status,
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'quotations'), finalData);
      
      const publicLink = `${window.location.origin}/quotation/view/${docRef.id}`;
      await updateDoc(docRef, { publicLink });

      toast({ title: "Quotation Generated", description: `Reference ${quoteNumber} is now ${status}.` });
      router.push('/admin/quotations');
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Protocol: QUOTATION v2</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">
              {quoteNumber === '...' ? <Loader2 className="animate-spin h-6 w-6 inline" /> : quoteNumber}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
           <Button variant="outline" onClick={() => handleSave('Draft')} disabled={isSubmitting} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] bg-white border-gray-200 hover:bg-gray-50 shadow-sm">Save Draft</Button>
           <Button onClick={() => handleSave('Sent')} disabled={isSubmitting} className="h-12 px-10 rounded-xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
             {isSubmitting ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Authorize & Publish</>}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT: MAIN FORM AREA */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* CLIENT SECTION */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <Users size={18} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Client Identification</h3>
            </div>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Registry Quick-Find</Label>
                  <Select onValueChange={handleClientSelect}>
                    <SelectTrigger className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner">
                      <SelectValue placeholder="Search existing customer..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[300]">
                      {clients?.map(c => <SelectItem key={c.id} value={c.id} className="py-3 uppercase font-bold text-xs">{c.name} — {c.phone}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Legal Full Name</Label>
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="Recipient Name" className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Contact Matrix (Phone)</Label>
                  <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Organization / Branch</Label>
                  <Input value={customer.company} onChange={e => setCustomer({...customer, company: e.target.value})} placeholder="Company Name (Optional)" className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Service Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-primary" size={20} />
                    <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="House, Road, Block, Area..." className="min-h-[100px] pl-12 bg-gray-50 border-none rounded-[2rem] p-6 font-medium shadow-inner focus:bg-white transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* SERVICE MATRIX SECTION */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <Wrench size={18} className="text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Service & Workload Matrix</h3>
              </div>
              <Button onClick={addItem} variant="ghost" size="sm" className="h-10 px-6 rounded-xl border-2 border-dashed border-primary/20 text-primary font-black uppercase text-[10px] hover:bg-primary/5">+ Add Manual Row</Button>
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
                               <SelectValue placeholder="Choose standard service..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl z-[300]">
                               {services?.map(s => <SelectItem key={s.id} value={s.id} className="py-3 font-bold text-xs uppercase">{s.title}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="md:col-span-6 space-y-2">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Custom Display Title</Label>
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
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Quantity</Label>
                         <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-black text-sm shadow-inner" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Scale / Unit</Label>
                         <Input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-black text-[10px] uppercase shadow-inner" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Total Result</Label>
                         <div className="h-11 bg-gray-100 rounded-xl flex items-center px-4 font-black text-sm text-gray-400 shadow-inner">৳{( (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1) ).toLocaleString()}</div>
                       </div>
                    </div>
                    <Textarea value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Specify technical scope or customized inclusions for this item..." className="bg-gray-50 border-none rounded-2xl min-h-[60px] text-xs font-medium p-4 shadow-inner" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* TERMS SECTION */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 border-b pb-3">
                <Layers size={18} className="text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Contract Terms & Notes</h3>
             </div>
             <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Level Agreement (Terms)</Label>
                    <Textarea value={config.terms} onChange={e => setConfig({...config, terms: e.target.value})} className="min-h-[200px] bg-gray-50 border-none rounded-3xl p-8 font-medium text-sm leading-loose shadow-inner focus:bg-white transition-all" />
                  </div>
               </CardContent>
             </Card>
          </section>
        </div>

        {/* RIGHT: STICKY BILLING SIDEBAR */}
        <div className="lg:col-span-4 lg:sticky lg:top-10 space-y-8">
           <Card className="border-none shadow-2xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden border-t-[12px] border-primary">
             <CardHeader className="p-8 border-b border-white/5 bg-black/10 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Bill Protocol</CardTitle>
                   <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time valuation</p>
                </div>
                <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20"><Calculator size={22}/></div>
             </CardHeader>
             <CardContent className="p-8 space-y-10">
                <div className="space-y-5">
                   <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest">
                     <span>Base Estimate</span>
                     <span>৳{totals.subtotal.toLocaleString()}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6 items-center">
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
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Tax / VAT (%)</Label>
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
                   <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex items-start gap-4">
                      <ShieldCheck size={28} className="text-primary mt-1 shrink-0" />
                      <p className="text-[11px] font-bold text-white/60 leading-relaxed uppercase">
                         Authorized quote status: <span className="text-white">DRAFT</span>. Publish to generate a unique public link for the customer.
                      </p>
                   </div>
                   <Button 
                    onClick={() => handleSave('Sent')}
                    disabled={isSubmitting}
                    className="w-full h-16 md:h-20 rounded-[2rem] bg-primary hover:bg-[#15435a] font-black text-2xl uppercase tracking-tight shadow-2xl shadow-primary/20 gap-4 active:scale-95 transition-all"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : <><Zap size={28} fill="currentColor" /> Deploy Estimate</>}
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
                       <Label className="text-[9px] font-black text-gray-400 uppercase ml-1">Issue Protocol</Label>
                       <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black text-gray-400 uppercase ml-1">Expiry Protocol</Label>
                       <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Assigned Sales Agent</Label>
                    <Input value={config.salesPerson} onChange={e => setConfig({...config, salesPerson: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                 </div>
                 <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                   <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                   <p className="text-[10px] font-medium text-blue-800 leading-relaxed uppercase">
                     Expired estimates are automatically hidden from the public portal.
                   </p>
                 </div>
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
