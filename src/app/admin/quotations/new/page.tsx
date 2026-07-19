
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNextQuotationNumber } from '@/lib/quotation-utils';

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
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), where('status', '==', 'Active')) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer')) : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);

  const { data: services } = useCollection(servicesQuery);
  const { data: allSubs } = useCollection(subServicesQuery);
  const { data: clients } = useCollection(customersQuery);
  const { data: quoteSettings } = useDoc(settingsRef);

  useEffect(() => {
    if (db) {
      getNextQuotationNumber(db).then(setQuoteNumber);
    }
  }, [db]);

  useEffect(() => {
    if (quoteSettings && !isNew) {
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

  const isNew = true;

  const addItem = () => setItems([...items, { id: 'manual-' + Date.now(), name: '', description: '', price: '', quantity: 1, unit: 'Qty' }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, val: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const addAddOn = () => setAddOns([...addOns, { id: 'addon-' + Date.now(), name: '', price: '', quantity: 1 }]);
  const removeAddOn = (id: string) => setAddOns(addOns.filter(a => a.id !== id));
  const updateAddOn = (id: string, field: string, val: any) => {
    setAddOns(addOns.map(a => a.id === id ? { ...a, [field]: val } : a));
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
      nextIdx: nextItems[itemIdx] = {
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
      
      // Update Public Link
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
    <div className="space-y-8 pb-32 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none italic">New Quotation</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Authorized Sales Protocol</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" onClick={() => handleSave('Draft')} disabled={isSubmitting} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] bg-white border-primary/20 text-primary">Save Draft</Button>
           <Button onClick={() => handleSave('Sent')} disabled={isSubmitting} className="h-12 px-10 rounded-xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2">
             {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Publish & Share</>}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8 space-y-10">
          
          {/* CLIENT CONFIG */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><User size={18} className="text-primary"/> Client Identity</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Search Registry</Label>
                  <Select onValueChange={handleClientSelect}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner">
                      <SelectValue placeholder="Existing Customer..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {clients?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold py-3 uppercase text-[10px]">{c.name} ({c.phone})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Legal Name</Label>
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mobile Contact</Label>
                  <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Address</Label>
                  <Input value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company / Branch</Label>
                <Input value={customer.company} onChange={e => setCustomer({...customer, company: e.target.value})} placeholder="Organization Name (Optional)" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Site / Billing Address</Label>
                <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="min-h-[80px] bg-gray-50 border-none rounded-2xl p-4 shadow-inner" />
              </div>
            </CardContent>
          </Card>

          {/* SERVICE MATRIX */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Service & Workload Matrix</CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase text-primary">Component based pricing structure</CardDescription>
              </div>
              <Button onClick={addItem} variant="ghost" size="sm" className="h-9 px-4 rounded-xl border-2 border-dashed border-primary/20 text-primary font-black uppercase text-[10px]">+ Add Manual Item</Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6 group">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-5 space-y-2">
                         <Label className="text-[9px] font-black uppercase text-gray-400">Select From Catalog</Label>
                         <Select onValueChange={(v) => handleServiceSelect(v, idx)}>
                            <SelectTrigger className="h-11 bg-white border-none rounded-xl font-bold shadow-sm">
                               <SelectValue placeholder="Link to service..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                               {services?.map(s => <SelectItem key={s.id} value={s.id} className="py-2.5 font-bold text-[10px] uppercase">{s.title}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="md:col-span-4 space-y-2">
                         <Label className="text-[9px] font-black uppercase text-gray-400">Custom Label</Label>
                         <Input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="h-11 bg-white border-none rounded-xl font-black text-xs" />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                         <button type="button" onClick={() => removeItem(item.id)} className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400">Rate</Label>
                         <Input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="h-10 bg-white border-none rounded-xl font-black text-xs text-primary" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400">Qty</Label>
                         <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-10 bg-white border-none rounded-xl font-black text-xs" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400">Unit</Label>
                         <Input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="h-10 bg-white border-none rounded-xl font-black text-xs" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-gray-400">Total</Label>
                         <div className="h-10 bg-gray-100 rounded-xl flex items-center px-4 font-black text-xs text-gray-400">৳{( (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1) ).toLocaleString()}</div>
                       </div>
                    </div>
                    <Textarea value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Technical specification for this item..." className="bg-white border-none rounded-2xl min-h-[60px] text-[10px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DYNAMIC TERMS */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-gray-100">
             <CardHeader className="p-8 bg-gray-50/50 border-b flex items-center justify-between">
                <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Terms & Conditions</CardTitle>
                <Layers size={18} className="text-primary"/>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <Textarea value={config.terms} onChange={e => setConfig({...config, terms: e.target.value})} className="min-h-[150px] bg-gray-50 border-none rounded-2xl p-6 font-medium text-sm leading-loose" />
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Customer Notes (Visible on Print)</Label>
                  <Input value={config.customerNotes} onChange={e => setConfig({...config, customerNotes: (e.target as any).value})} placeholder="e.g. Validity strictly 7 days." className="h-12 bg-gray-50 border-none rounded-xl font-medium" />
                </div>
             </CardContent>
          </Card>
        </div>

        {/* SUMMARY SIDEBAR */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b border-white/5 bg-black/10 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">Bill Protocol</CardTitle>
                   <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">REF: {quoteNumber}</p>
                </div>
                <div className="p-3 bg-primary rounded-2xl shadow-xl"><Calculator size={20}/></div>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                   <div className="flex justify-between text-xs font-bold text-white/40 uppercase"><span>Subtotal (Base)</span><span>৳{totals.subtotal.toLocaleString()}</span></div>
                   
                   <div className="grid grid-cols-2 gap-4 items-center pt-2">
                      <Label className="text-[9px] font-black uppercase text-white/40">Discount</Label>
                      <div className="flex gap-2">
                         <Select value={pricing.discountType} onValueChange={(v: any) => setPricing({...pricing, discountType: v})}>
                            <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-[9px] font-black uppercase w-16"><SelectValue/></SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl z-[300]"><SelectItem value="percentage" className="text-[10px] font-black">%</SelectItem><SelectItem value="fixed" className="text-[10px] font-black">৳</SelectItem></SelectContent>
                         </Select>
                         <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black text-rose-400" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-[9px] font-black uppercase text-white/40">Other Charges</Label>
                      <Input type="number" value={pricing.additional} onChange={e => setPricing({...pricing, additional: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black" />
                   </div>

                   <div className="grid grid-cols-2 gap-4 items-center pb-4 border-b border-white/5">
                      <Label className="text-[9px] font-black uppercase text-white/40">VAT (%)</Label>
                      <Input type="number" value={pricing.vatPercent} onChange={e => setPricing({...pricing, vatPercent: parseFloat(e.target.value) || 0})} className="h-10 bg-white/5 border-white/10 rounded-xl text-right font-black" />
                   </div>

                   <div className="pt-6 flex flex-col gap-1">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Estimated Total</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-6xl font-black tracking-tighter text-primary italic">৳{totals.total.toLocaleString()}</span>
                         <Badge className="bg-primary/20 text-primary border-none font-black text-[9px]">BDT</Badge>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-start gap-4">
                      <ShieldCheck size={24} className="text-primary mt-1 shrink-0" />
                      <p className="text-[11px] font-bold text-white/60 leading-relaxed uppercase">
                         This estimation is valid for <span className="text-white">7 days</span>. Final bill may vary based on actual on-site measurements.
                      </p>
                   </div>
                   <Button 
                    onClick={() => handleSave('Sent')}
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-[2.5rem] bg-primary hover:bg-[#15435a] font-black text-lg uppercase tracking-tight shadow-2xl shadow-primary/20 gap-3 active:scale-95 transition-all"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <><Zap size={20} /> Authorize & Launch</>}
                   </Button>
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl p-8 border border-gray-100 space-y-6">
             <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Settings2 size={14}/> Validity Logic</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <Label className="text-[9px] font-black uppercase text-gray-400">Issue Date</Label>
                   <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[9px] font-black uppercase text-gray-400">Expiry Date</Label>
                   <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
             </div>
             <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gray-400">Sales Assigned</Label>
                <Input value={config.salesPerson} onChange={e => setConfig({...config, salesPerson: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl font-bold" />
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
