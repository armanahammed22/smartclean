'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, where, doc, setDoc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  User as UserIcon, 
  ShoppingCart,
  X,
  FileSpreadsheet,
  ListChecks,
  Zap,
  Calculator,
  Search,
  Check,
  UserPlus,
  PackagePlus,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNextQuotationNumber, convertQuotationToBooking } from '@/lib/quotation-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CreateQuotationPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');

  // Mode States
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isManualItem, setIsManualItem] = useState(false);
  const [syncToBooking, setSyncToBooking] = useState(true);

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', email: '', company: '', address: '' });
  
  // Manual Item Helper State
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: 1, unit: 'Qty' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', additional: 0, vatPercent: 0 });
  const [config, setConfig] = useState({ 
    issueDate: new Date().toISOString().split('T')[0], 
    expiryDate: '', 
    terms: [] as string[], 
    salesPerson: user?.displayName || '',
    footerServices: '',
    customerNotes: ''
  });

  // Data Fetch
  const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const customersRef = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);

  const { data: servicesRaw } = useCollection(servicesRef);
  const { data: customersRaw } = useCollection(customersRef);
  const { data: quoteSettings } = useDoc(settingsRef);

  const services = useMemo(() => {
    return servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  const clients = useMemo(() => {
    return customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')) || [];
  }, [customersRaw]);

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
        terms: Array.isArray(quoteSettings.defaultTerms) ? quoteSettings.defaultTerms : [quoteSettings.defaultTerms || ''],
        footerServices: quoteSettings.defaultFooterServices || ''
      }));
    }
  }, [quoteSettings]);

  const addTerm = () => setConfig({ ...config, terms: [...config.terms, ''] });
  const updateTerm = (idx: number, val: string) => {
    const next = [...config.terms];
    next[idx] = val;
    setConfig({ ...config, terms: next });
  };
  const removeTerm = (idx: number) => setConfig({ ...config, terms: config.terms.filter((_, i) => i !== idx) });

  const handleAddItemToBill = () => {
    if (isManualItem) {
      if (!manualItem.name || !manualItem.price) return;
      const newItem = {
        id: 'manual-' + Date.now(),
        name: manualItem.name,
        price: parseFloat(manualItem.price) || 0,
        quantity: manualItem.quantity,
        unit: manualItem.unit,
        discount: 0,
        total: (parseFloat(manualItem.price) || 0) * manualItem.quantity
      };
      setItems([...items, newItem]);
      setManualItem({ name: '', price: '', quantity: 1, unit: 'Qty' });
    } else {
      const service = services.find(s => s.id === selectedProductId);
      if (!service) return;
      const newItem = {
        id: service.id + '-' + Date.now(),
        serviceId: service.id,
        name: service.title,
        price: service.basePrice,
        quantity: selectedQty,
        unit: service.pricingType === 'sqft' ? 'Sqft' : 'Pcs',
        discount: 0,
        total: service.basePrice * selectedQty
      };
      setItems([...items, newItem]);
      setSelectedProductId('');
      setSelectedQty(1);
    }
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateItemField = (id: string, field: string, val: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: val };
        updated.total = (parseFloat(updated.price) || 0) * (parseFloat(updated.quantity) || 0) - (parseFloat(updated.discount) || 0);
        return updated;
      }
      return i;
    }));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    const itemDiscounts = items.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0);
    
    let globalDiscountAmt = pricing.discountType === 'percentage' 
      ? (subtotal * (pricing.discount / 100)) 
      : pricing.discount;
      
    const finalTotal = subtotal - itemDiscounts - globalDiscountAmt + (pricing.additional || 0);

    return { subtotal, itemDiscounts, globalDiscountAmt, total: Math.max(0, finalTotal) };
  }, [items, pricing]);

  const handleSave = async (status: string) => {
    if (!db) return;
    if (!customer.name || items.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Customer and items are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      let currentCustomerId = customer.id;

      if (isNewCustomer || !currentCustomerId) {
        const phone = customer.phone.replace(/\D/g, '');
        const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
        const existing = await getDocs(q);
        
        if (existing.empty) {
          const newRef = doc(collection(db, 'users'));
          await setDoc(newRef, {
            uid: newRef.id,
            name: customer.name,
            phone: phone,
            email: customer.email || '',
            address: customer.address,
            role: 'customer',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          currentCustomerId = newRef.id;
        } else {
          currentCustomerId = existing.docs[0].id;
        }
      }

      const finalData: any = {
        quoteNumber,
        customerId: currentCustomerId,
        customerInfo: { ...customer, id: currentCustomerId },
        items: items.map(i => ({ ...i, price: parseFloat(i.price) || 0, quantity: parseFloat(i.quantity) || 1, discount: parseFloat(i.discount) || 0 })),
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        total: totals.total,
        status,
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const quoteDocRef = await addDoc(collection(db, 'quotations'), finalData);
      
      if (syncToBooking) {
        await convertQuotationToBooking(db, { ...finalData, id: quoteDocRef.id });
      }

      router.push('/admin/quotations');
      toast({ title: "Quotation Generated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 min-w-0 -mt-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border hover:bg-gray-50">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Create Quotation</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-xl border">
              <Label className="text-[9px] font-black uppercase text-gray-400">Sync to Bookings</Label>
              <Switch checked={syncToBooking} onCheckedChange={setSyncToBooking} className="scale-75" />
           </div>
           <Button variant="outline" onClick={() => handleSave('Draft')} disabled={isSubmitting} className="h-9 px-4 rounded-lg font-bold text-[10px] uppercase">Draft</Button>
           <Button onClick={() => handleSave('Sent')} disabled={isSubmitting} className="h-9 px-6 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-lg">
             {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : "Save & Send"}
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <UserIcon size={12} /> Client Identity
            </CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-primary">New Profile</Label>
               <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Customer Name</Label>
                {isNewCustomer ? (
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="Full Name" className="h-9 bg-white border-primary/20 rounded-lg shadow-sm" />
                ) : (
                  <Select value={customer.id} onValueChange={(val) => {
                    const c = clients?.find(i => i.id === val);
                    if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', email: c.email || '', company: c.company || '', address: c.address || '' });
                  }}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 rounded-lg shadow-sm">
                      <SelectValue placeholder="Search existing..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {clients?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name} ({c.phone})</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Mobile Number</Label>
                <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-9 rounded-lg" disabled={!isNewCustomer && customer.id !== ''} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Issue Date</Label>
                <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9 bg-white rounded-lg text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Expiry Date</Label>
                <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9 bg-white rounded-lg text-xs" />
              </div>
              
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Detailed Address</Label>
                <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="House, Road, Area, District" className="h-9 bg-white rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <ShoppingCart size={12} /> Item Selection
            </CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-primary">Manual Entry</Label>
               <Switch checked={isManualItem} onCheckedChange={setIsManualItem} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50/50 p-3 rounded-xl border">
              {!isManualItem ? (
                <>
                  <div className="md:col-span-7 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Catalog Items</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-9 bg-white border-gray-200 rounded-lg">
                        <SelectValue placeholder="Choose standard service..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {services.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area Qty</Label>
                    <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9 bg-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Manual Name</Label>
                    <Input value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} placeholder="Service Name" className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Rate</Label>
                    <Input type="number" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: e.target.value})} placeholder="0.00" className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area</Label>
                    <Input type="number" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: parseInt(e.target.value) || 1})} className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit</Label>
                    <Select value={manualItem.unit} onValueChange={v => setManualItem({...manualItem, unit: v})}>
                      <SelectTrigger className="h-9 bg-white rounded-lg px-2 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-bold uppercase">{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <Button type="button" onClick={handleAddItemToBill} className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase gap-2">
                  <Plus size={14} /> Add Item
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-none">
                    <TableHead className="text-[9px] font-black uppercase py-3">Item Name</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit/Area</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-24">Rate</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-28">Discount (৳)</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-28">Subtotal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/30">
                      <TableCell className="py-3">
                        <p className="font-bold text-[11px] text-gray-900 uppercase">{item.name}</p>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-7 w-16 mx-auto text-center font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={v => updateItemField(item.id, 'unit', v)}>
                          <SelectTrigger className="h-7 w-20 mx-auto text-[9px] font-black uppercase bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', parseFloat(e.target.value) || 0)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.discount} onChange={e => updateItemField(item.id, 'discount', parseFloat(e.target.value) || 0)} className="h-7 w-24 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell className="text-right font-black text-[11px] text-gray-900">৳{item.total?.toFixed(2)}</TableCell>
                      <TableCell><button type="button" onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button></TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-300 italic text-[10px] uppercase tracking-widest">Add items above to calculate bill.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Terms & Registry</Label>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                  {config.terms.map((term: string, i: number) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                      <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="h-8 border-none bg-gray-50 text-[10px] font-medium" />
                      <button type="button" onClick={() => removeTerm(i)} className="p-1.5 text-gray-300 hover:text-red-500 group-hover:opacity-100 opacity-0"><X size={12}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={addTerm} className="w-full flex items-center justify-center gap-2 border-dashed border-2 rounded-lg h-9 text-[9px] font-black uppercase text-gray-400 hover:text-primary hover:border-primary transition-all">
                    <Plus size={12}/> Add Custom Rule
                  </button>
                </div>
             </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-xl rounded-2xl bg-slate-50 border border-gray-100 overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Gross Valuation</span>
                  <span>৳{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                   <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Global Adjustment</span>
                   <div className="flex gap-1">
                      <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 w-20 bg-white border-gray-200 text-center font-black text-rose-600 shadow-sm" />
                      <Select value={pricing.discountType} onValueChange={(v: any) => setPricing({...pricing, discountType: v})}>
                         <SelectTrigger className="h-9 w-14 bg-white border-gray-200 text-xs font-black"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="percentage" className="text-xs">%</SelectItem><SelectItem value="fixed" className="text-xs">৳</SelectItem></SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="pt-6 flex justify-between items-end border-t border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Net Payable Result</span>
                    <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
