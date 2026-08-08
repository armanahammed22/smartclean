
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, where, doc, setDoc, getDocs, limit, serverTimestamp } from 'firebase/firestore';
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
  Calculator,
  Search,
  Zap,
  Layers,
  Edit2,
  ListPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNextQuotationNumber, convertQuotationToBooking } from '@/lib/quotation-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EntryMode = 'dynamic' | 'combo' | 'manual';

export default function CreateQuotationPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');

  // 🛠️ Entry Mode State
  const [entryMode, setEntryMode] = useState<EntryMode>('dynamic');

  // Mode States
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [syncToBooking, setSyncToBooking] = useState(true);

  // Identity Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  
  // Dynamic Mode Cart
  const [dynamicItems, setDynamicItems] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  // Combo Mode State
  const [comboServices, setComboServices] = useState<string[]>(['']);
  const [comboTotalPrice, setComboTotalPrice] = useState('');

  // Manual Mode State
  const [manualRows, setManualRows] = useState<any[]>([{ name: '', price: '', quantity: 1, unit: 'Qty' }]);

  const [pricing, setPricing] = useState({ discount: 0, additional: 0 });
  const [config, setConfig] = useState({ 
    issueDate: new Date().toISOString().split('T')[0], 
    expiryDate: '', 
    terms: [] as string[]
  });

  // Data Fetch
  const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const customersRef = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);

  const { data: servicesRaw } = useCollection(servicesRef);
  const { data: customersRaw } = useCollection(customersRef);
  const { data: quoteSettings } = useDoc(settingsRef);

  const services = useMemo(() => servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [], [servicesRaw]);
  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')) || [], [customersRaw]);

  useEffect(() => {
    if (db) getNextQuotationNumber(db).then(setQuoteNumber);
    if (quoteSettings) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (quoteSettings.defaultValidityDays || 7));
      setConfig(prev => ({ 
        ...prev, 
        expiryDate: expiry.toISOString().split('T')[0],
        terms: Array.isArray(quoteSettings.defaultTerms) ? quoteSettings.defaultTerms : [quoteSettings.defaultTerms || '']
      }));
    }
  }, [db, quoteSettings]);

  // Logic Helpers
  const addComboRow = () => setComboServices([...comboServices, '']);
  const removeComboRow = (idx: number) => setComboServices(comboServices.filter((_, i) => i !== idx));
  const updateComboRow = (idx: number, val: string) => {
    const next = [...comboServices];
    next[idx] = val;
    setComboServices(next);
  };

  const addManualRow = () => setManualRows([...manualRows, { name: '', price: '', quantity: 1, unit: 'Qty' }]);
  const removeManualRow = (idx: number) => setManualRows(manualRows.filter((_, i) => i !== idx));
  const updateManualRow = (idx: number, field: string, val: any) => {
    const next = [...manualRows];
    next[idx][field] = val;
    setManualRows(next);
  };

  const handleAddDynamic = () => {
    const service = services.find(s => s.id === selectedProductId);
    if (!service) return;
    setDynamicItems([...dynamicItems, { id: service.id + '-' + Date.now(), name: service.title, price: service.basePrice, quantity: selectedQty, unit: service.pricingType === 'sqft' ? 'Sqft' : 'Pcs' }]);
    setSelectedProductId('');
    setSelectedQty(1);
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    if (entryMode === 'dynamic') subtotal = dynamicItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    else if (entryMode === 'combo') subtotal = parseFloat(comboTotalPrice) || 0;
    else subtotal = manualRows.reduce((acc, i) => acc + ((parseFloat(i.price) || 0) * i.quantity), 0);
    
    const finalTotal = subtotal - pricing.discount + pricing.additional;
    return { subtotal, total: Math.max(0, finalTotal) };
  }, [entryMode, dynamicItems, comboTotalPrice, manualRows, pricing]);

  const handleSave = async (status: string) => {
    if (!db) return;
    if (!customer.name || (entryMode === 'dynamic' && dynamicItems.length === 0)) {
      toast({ variant: "destructive", title: "Missing Data" });
      return;
    }

    setIsSubmitting(true);
    try {
      let currentCustomerId = customer.id;
      if (isNewCustomer || !currentCustomerId) {
        const phone = customer.phone.replace(/\D/g, '');
        const newRef = doc(collection(db, 'users'));
        await setDoc(newRef, { uid: newRef.id, name: customer.name, phone, role: 'customer', status: 'active', createdAt: new Date().toISOString() });
        currentCustomerId = newRef.id;
      }

      let items = [];
      if (entryMode === 'dynamic') items = dynamicItems.map(i => ({ ...i, itemType: 'service' }));
      else if (entryMode === 'combo') items = comboServices.filter(s => !!s).map(s => ({ name: s, itemType: 'combo_member', price: 0, quantity: 1 }));
      else items = manualRows.filter(r => !!r.name).map(r => ({ ...r, price: parseFloat(r.price) || 0, itemType: 'manual' }));

      const finalData = {
        quoteNumber,
        customerId: currentCustomerId,
        customerInfo: { ...customer, id: currentCustomerId },
        items,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        total: totals.total,
        pricingMode: entryMode,
        status,
        ...config,
        createdAt: new Date().toISOString()
      };

      const quoteRef = await addDoc(collection(db, 'quotations'), finalData);
      if (syncToBooking) await convertQuotationToBooking(db, { ...finalData, id: quoteRef.id } as any);

      toast({ title: "Quotation Generated" });
      router.push('/admin/quotations');
    } catch (e) {
      toast({ variant: "destructive", title: "Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 min-w-0 -mt-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border"><ArrowLeft size={16} /></Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">{quoteNumber || 'New Estimate'}</h1>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => handleSave('Draft')} disabled={isSubmitting} className="h-9 px-4 rounded-lg font-bold text-[10px] uppercase">Draft</Button>
           <Button onClick={() => handleSave('Sent')} disabled={isSubmitting} className="h-9 px-6 rounded-lg font-black uppercase text-[10px] bg-primary text-white">Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border shadow-sm">
        {(['dynamic', 'combo', 'manual'] as EntryMode[]).map(m => (
          <button key={m} type="button" onClick={() => setEntryMode(m)} className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all", entryMode === m ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-gray-400")}>
            {m === 'dynamic' ? <Zap size={14}/> : m === 'combo' ? <Layers size={14}/> : <Edit2 size={14}/>} {m}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><UserIcon size={12}/> Client Identity</CardTitle>
          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border">
             <Label className="text-[8px] font-black uppercase text-primary">New Profile</Label>
             <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Name</Label>
            {isNewCustomer ? <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9 font-bold" /> : (
              <Select onValueChange={(val) => { const c = clients?.find(i => i.id === val); if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', address: c.address || '', email: c.email || '' }); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Search..." /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Phone</Label><Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" /></div>
          <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Issue Date</Label><Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9 bg-white" /></div>
          <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Expiry Date</Label><Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9 bg-white" /></div>
          <div className="md:col-span-4 space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Location</Label><Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9 bg-white" /></div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex items-center justify-between"><CardTitle className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-2"><ShoppingCart size={12}/> Service List ({entryMode.toUpperCase()})</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          {entryMode === 'dynamic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
                <div className="md:col-span-7 space-y-1"><Label className="text-[9px] font-bold uppercase text-gray-400">Select Service</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Choose..." /></SelectTrigger>
                    <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1"><Label className="text-[9px] font-bold uppercase text-gray-400">Qty</Label><Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9 bg-white" /></div>
                <Button type="button" onClick={handleAddDynamic} className="md:col-span-2 h-9 bg-blue-600 font-bold text-[10px] uppercase"><Plus size={14} /> Add</Button>
              </div>
              <Table><TableHeader><TableRow><TableHead className="text-[9px] font-black uppercase">Name</TableHead><TableHead className="text-center text-[9px] font-black uppercase">Qty</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Rate</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Subtotal</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>{dynamicItems.map((item, idx) => (
                  <TableRow key={idx}><TableCell className="py-3 font-bold text-[11px] text-gray-900 uppercase">{item.name}</TableCell><TableCell className="text-center text-[11px] font-black">{item.quantity} {item.unit}</TableCell><TableCell className="text-right text-[11px] font-black text-gray-400">৳{item.price.toLocaleString()}</TableCell><TableCell className="text-right font-black text-[11px] text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</TableCell><TableCell><button onClick={() => setDynamicItems(dynamicItems.filter((_, i) => i !== idx))} className="text-rose-400"><Trash2 size={14}/></button></TableCell></TableRow>))}</TableBody>
              </Table>
            </div>
          )}

          {entryMode === 'combo' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-gray-400">Included Services (Custom List)</Label>
                {comboServices.map((s, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={s} onChange={e => updateComboRow(idx, e.target.value)} placeholder="Type service name..." className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs" />
                    {comboServices.length > 1 && <button onClick={() => removeComboRow(idx)} className="text-rose-400 hover:text-rose-600"><X size={18}/></button>}
                  </div>
                ))}
                <Button type="button" onClick={addComboRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><Plus size={14} /> Add Service Name</Button>
              </div>
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                 <Label className="text-[10px] font-black uppercase text-indigo-700">Combined Package Rate (৳)</Label>
                 <Input type="number" value={comboTotalPrice} onChange={e => setComboTotalPrice(e.target.value)} className="h-12 w-48 bg-white border-none rounded-xl font-black text-lg text-indigo-700 text-right" />
              </div>
            </div>
          )}

          {entryMode === 'manual' && (
            <div className="space-y-4">
              <Table><TableHeader><TableRow><TableHead className="text-[10px] uppercase">Service Name</TableHead><TableHead className="text-center w-24 uppercase">Rate</TableHead><TableHead className="text-center w-20 uppercase">Qty</TableHead><TableHead className="text-center w-24 uppercase">Unit</TableHead><TableHead className="text-right w-28 uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>{manualRows.map((row, idx) => (
                  <TableRow key={idx}><TableCell><Input value={row.name} onChange={e => updateManualRow(idx, 'name', e.target.value)} className="h-8 text-xs font-bold bg-gray-50 border-none" placeholder="Service Name" /></TableCell>
                    <TableCell><Input type="number" value={row.price} onChange={e => updateManualRow(idx, 'price', e.target.value)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                    <TableCell><Input type="number" value={row.quantity} onChange={e => updateManualRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                    <TableCell><Select value={row.unit} onValueChange={v => updateManualRow(idx, 'unit', v)}><SelectTrigger className="h-8 text-[10px] uppercase font-black"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Qty">Qty</SelectItem><SelectItem value="Sqft">Sqft</SelectItem><SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="Room">Room</SelectItem></SelectContent></Select></TableCell>
                    <TableCell className="text-right font-black text-xs text-primary">৳{((parseFloat(row.price) || 0) * row.quantity).toLocaleString()}</TableCell>
                    <TableCell><button onClick={() => removeManualRow(idx)} className="text-rose-400"><X size={16}/></button></TableCell></TableRow>))}</TableBody>
              </Table>
              <Button type="button" onClick={addManualRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><ListPlus size={14} /> Add Manual Row</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-8 bg-slate-50 border border-gray-100 rounded-[2.5rem] flex justify-between items-end">
        <div className="flex flex-col"><span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Proposed Final Amount</span><span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toLocaleString()}</span></div>
        <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
      </div>
    </div>
  );
}
