
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, where, doc, setDoc, getDocs, limit, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
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
  Calculator,
  Search,
  Banknote,
  ReceiptText,
  Layers,
  Edit2,
  Zap,
  ListPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getNextInvoiceNumber } from '@/lib/invoice-utils';

type EntryMode = 'dynamic' | 'combo' | 'manual';

export default function CreateInvoicePage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // 🛠️ Entry Mode State
  const [entryMode, setEntryMode] = useState<EntryMode>('dynamic');

  // Mode States
  const [isNewCustomer, setIsNewCustomer] = useState(false);

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

  const [pricing, setPricing] = useState({ discount: 0, delivery: 0 });
  const [payment, setPayment] = useState({ paidAmount: '0', method: 'Cash' });
  const [config, setConfig] = useState({ 
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '' 
  });

  // Data Fetch
  const customersRef = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);
  const { data: customersRaw } = useCollection(customersRef);
  const { data: servicesRaw } = useCollection(servicesRef);

  const services = useMemo(() => servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [], [servicesRaw]);
  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')) || [], [customersRaw]);

  useEffect(() => {
    if (db) getNextInvoiceNumber(db).then(setInvoiceNumber);
  }, [db]);

  // Actions
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
    
    const finalTotal = subtotal + pricing.delivery - pricing.discount;
    const initialPaid = parseFloat(payment.paidAmount) || 0;
    const dueAmount = Math.max(0, finalTotal - initialPaid);

    return { subtotal, total: finalTotal, initialPaid, dueAmount };
  }, [entryMode, dynamicItems, comboTotalPrice, manualRows, pricing, payment]);

  const handleSave = async () => {
    if (!db) return;
    if (!customer.name) {
      toast({ variant: "destructive", title: "Identity Required" });
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      let currentCustomerId = customer.id;
      if (isNewCustomer || !currentCustomerId) {
        const phone = customer.phone.replace(/\D/g, '');
        const newRef = doc(collection(db, 'users'));
        batch.set(newRef, { uid: newRef.id, name: customer.name, phone, role: 'customer', status: 'active', totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0, createdAt: new Date().toISOString() });
        currentCustomerId = newRef.id;
      }

      let items = [];
      if (entryMode === 'dynamic') items = dynamicItems.map(i => ({ ...i, itemType: 'service' }));
      else if (entryMode === 'combo') items = comboServices.filter(s => !!s).map(s => ({ name: s, itemType: 'combo_member', price: 0, quantity: 1 }));
      else items = manualRows.filter(r => !!r.name).map(r => ({ ...r, price: parseFloat(r.price) || 0, itemType: 'manual' }));

      const invoiceRef = doc(collection(db, 'invoices'));
      const invoiceData = {
        invoiceNumber,
        customerId: currentCustomerId,
        customerInfo: { ...customer, id: currentCustomerId },
        items,
        subtotal: totals.subtotal,
        pricingMode: entryMode,
        discount: pricing.discount,
        deliveryCharge: pricing.delivery,
        total: totals.total,
        paidAmount: totals.initialPaid,
        dueAmount: totals.dueAmount,
        paymentStatus: totals.dueAmount <= 0 ? 'Paid' : totals.initialPaid > 0 ? 'Partial' : 'Unpaid',
        paymentHistory: totals.initialPaid > 0 ? [{ id: 'init_'+Date.now(), amount: totals.initialPaid, date: new Date().toISOString(), method: payment.method, notes: 'Initial Settlement' }] : [],
        createdAt: new Date(config.issueDate).toISOString(),
        dueDate: config.expiryDate ? new Date(config.expiryDate).toISOString() : null,
        updatedAt: serverTimestamp()
      };

      batch.set(invoiceRef, invoiceData);
      if (currentCustomerId) {
        batch.update(doc(db, 'users', currentCustomerId), {
          totalInvoiced: increment(totals.total),
          totalPaid: increment(totals.initialPaid),
          outstandingBalance: increment(totals.dueAmount)
        });
      }

      await batch.commit();
      toast({ title: "Invoice Published" });
      router.push('/admin/invoices');
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
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">{invoiceNumber || 'New Invoice'}</h1>
        </div>
        <Button onClick={handleSave} disabled={isSubmitting} className="h-9 px-10 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl">
          {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : "Authorize Entry"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border shadow-sm">
        {(['dynamic', 'combo', 'manual'] as EntryMode[]).map(m => (
          <button key={m} type="button" onClick={() => setEntryMode(m)} className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all", entryMode === m ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-gray-400")}>
            {m === 'dynamic' ? <Zap size={14}/> : m === 'combo' ? <Layers size={14}/> : <Edit2 size={14}/>} {m}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between"><CardTitle className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-2"><UserIcon size={12}/> Client Registry</CardTitle>
          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border">
             <Label className="text-[8px] font-black uppercase text-primary">New Profile</Label>
             <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Customer Name</Label>
            {isNewCustomer ? <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9 font-bold" /> : (
              <Select onValueChange={(val) => { const c = clients?.find(i => i.id === val); if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', address: c.address || '' }); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Search..." /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Phone</Label><Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" /></div>
          <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Issue Date</Label><Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9 bg-white" /></div>
          <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Due Date</Label><Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9 bg-white" /></div>
          <div className="md:col-span-4 space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Address</Label><Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9 bg-white" /></div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex items-center justify-between"><CardTitle className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-2"><ShoppingCart size={12}/> Item Matrix ({entryMode.toUpperCase()})</CardTitle></CardHeader>
        <CardContent className="p-5 space-y-4">
          {entryMode === 'dynamic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
                <div className="md:col-span-7 space-y-1"><Label className="text-[9px] font-bold uppercase text-gray-400">Select Item</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Choose..." /></SelectTrigger>
                    <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1"><Label className="text-[9px] font-bold uppercase text-gray-400">Qty</Label><Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9 bg-white" /></div>
                <Button type="button" onClick={handleAddDynamic} className="md:col-span-2 h-9 bg-blue-600 font-bold text-[10px] uppercase shadow-md"><Plus size={14} /> Add to List</Button>
              </div>
              <Table><TableHeader><TableRow><TableHead className="text-[9px] font-black uppercase py-3">Name</TableHead><TableHead className="text-[9px] font-black uppercase text-center w-24">Qty</TableHead><TableHead className="text-[9px] font-black uppercase text-right w-24">Rate</TableHead><TableHead className="text-[9px] font-black uppercase text-right w-28">Net Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>{dynamicItems.map((item, idx) => (
                  <TableRow key={idx}><TableCell className="py-3 font-bold text-[11px] uppercase">{item.name}</TableCell><TableCell className="text-center font-black text-[11px]">{item.quantity} {item.unit}</TableCell><TableCell className="text-right text-[11px] font-black text-gray-400">৳{item.price.toLocaleString()}</TableCell><TableCell className="text-right font-black text-[11px] text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</TableCell><TableCell><button onClick={() => setDynamicItems(dynamicItems.filter((_, i) => i !== idx))} className="text-rose-400"><Trash2 size={14}/></button></TableCell></TableRow>))}</TableBody>
              </Table>
            </div>
          )}

          {entryMode === 'combo' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-gray-400">Services Included (Manual Type)</Label>
                {comboServices.map((s, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={s} onChange={e => updateComboRow(idx, e.target.value)} placeholder="Type service name..." className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                    {comboServices.length > 1 && <button onClick={() => removeComboRow(idx)} className="text-rose-400 hover:text-rose-600"><X size={18}/></button>}
                  </div>
                ))}
                <Button type="button" onClick={addComboRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><Plus size={14} /> Add Service Entry</Button>
              </div>
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                 <Label className="text-[10px] font-black uppercase text-indigo-700">One Time Package Bill (৳)</Label>
                 <Input type="number" value={comboTotalPrice} onChange={e => setComboTotalPrice(e.target.value)} className="h-12 w-48 bg-white border-none rounded-xl font-black text-lg text-indigo-700 text-right shadow-sm" />
              </div>
            </div>
          )}

          {entryMode === 'manual' && (
            <div className="space-y-4">
              <Table><TableHeader><TableRow><TableHead className="text-[10px] uppercase">Service/Product</TableHead><TableHead className="text-center w-24 uppercase">Price</TableHead><TableHead className="text-center w-20 uppercase">Qty</TableHead><TableHead className="text-center w-24 uppercase">Unit</TableHead><TableHead className="text-right w-28 uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>{manualRows.map((row, idx) => (
                  <TableRow key={idx}><TableCell><Input value={row.name} onChange={e => updateManualRow(idx, 'name', e.target.value)} className="h-8 text-xs font-bold bg-gray-50 border-none" placeholder="Description" /></TableCell>
                    <TableCell><Input type="number" value={row.price} onChange={e => updateManualRow(idx, 'price', e.target.value)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                    <TableCell><Input type="number" value={row.quantity} onChange={e => updateManualRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                    <TableCell><Select value={row.unit} onValueChange={v => updateManualRow(idx, 'unit', v)}><SelectTrigger className="h-8 text-[10px] uppercase font-black"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Qty">Qty</SelectItem><SelectItem value="Sqft">Sqft</SelectItem><SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="Room">Room</SelectItem></SelectContent></Select></TableCell>
                    <TableCell className="text-right font-black text-xs text-primary">৳{((parseFloat(row.price) || 0) * row.quantity).toLocaleString()}</TableCell>
                    <TableCell><button onClick={() => removeManualRow(idx)} className="text-rose-400"><X size={16}/></button></TableCell></TableRow>))}</TableBody>
              </Table>
              <Button type="button" onClick={addManualRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><ListPlus size={14} /> Add New Row</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-slate-50 border border-gray-100 p-6 rounded-[1.5rem] space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>Net Value</span><span>৳{totals.subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between items-center gap-4">
             <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Entry Settlement (৳)</span>
             <Input type="number" value={payment.paidAmount} onChange={e => setPayment({...payment, paidAmount: e.target.value})} className="h-8 w-32 bg-white border-emerald-100 text-center font-black text-emerald-600 shadow-sm" />
          </div>
          <div className="pt-5 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
             <div className="flex flex-col"><span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Total Payable</span><span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toLocaleString()}</span></div>
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><Calculator size={22}/></div>
          </div>
      </div>
    </div>
  );
}
