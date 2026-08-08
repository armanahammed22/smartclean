
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, where, doc, getDocs, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  User as UserIcon, 
  Wrench, 
  Zap,
  CheckCircle2,
  Calculator,
  X,
  PackagePlus,
  ShoppingCart,
  Layers,
  Edit2,
  ListPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EntryMode = 'dynamic' | 'combo' | 'manual';

export default function CreateManualBookingPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛠️ Entry Mode State
  const [entryMode, setEntryMode] = useState<EntryMode>('dynamic');

  // Feature Modes
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [schedule, setSchedule] = useState({ date: '', time: '8AM - 12PM' });
  
  // Dynamic Mode Cart
  const [dynamicItems, setDynamicItems] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState(1);

  // Combo Mode State
  const [comboServices, setComboServices] = useState<string[]>(['']);
  const [comboTotalPrice, setComboTotalPrice] = useState('');

  // Manual Mode State
  const [manualRows, setManualRows] = useState<any[]>([{ name: '', price: '', quantity: 1, unit: 'Qty' }]);

  // DB Fetch
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  
  const { data: servicesRaw } = useCollection(servicesQuery);
  const { data: customersRaw } = useCollection(customersQuery);

  const services = useMemo(() => {
    return servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [customersRaw]);

  // Actions
  const handleAddDynamic = () => {
    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;
    setDynamicItems([...dynamicItems, { id: service.id + '-' + Date.now(), serviceId: service.id, name: service.title, price: service.basePrice, quantity: selectedQty, unit: service.pricingType === 'sqft' ? 'Sqft' : 'Pcs' }]);
    setSelectedServiceId('');
    setSelectedQty(1);
  };

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

  const totals = useMemo(() => {
    let subtotal = 0;
    if (entryMode === 'dynamic') {
      subtotal = dynamicItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    } else if (entryMode === 'combo') {
      subtotal = parseFloat(comboTotalPrice) || 0;
    } else {
      subtotal = manualRows.reduce((acc, i) => acc + ((parseFloat(i.price) || 0) * i.quantity), 0);
    }
    return { subtotal, total: subtotal };
  }, [entryMode, dynamicItems, comboServices, comboTotalPrice, manualRows]);

  const handleCreateBooking = async () => {
    if (!db) return;
    if (!customer.name || !customer.phone || !schedule.date) {
      toast({ variant: "destructive", title: "Missing Info", description: "Customer details and date are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      let currentCustomerId = customer.id;
      if (isNewCustomer || !currentCustomerId) {
        const phone = customer.phone.replace(/\D/g, '');
        const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          const newRef = doc(collection(db, 'users'));
          await setDoc(newRef, { uid: newRef.id, name: customer.name, phone, address: customer.address, role: 'customer', status: 'active', createdAt: new Date().toISOString() });
          currentCustomerId = newRef.id;
        } else {
          currentCustomerId = snap.docs[0].id;
        }
      }

      let items = [];
      if (entryMode === 'dynamic') items = dynamicItems.map(i => ({ ...i, itemType: 'service' }));
      else if (entryMode === 'combo') items = comboServices.filter(s => !!s).map(s => ({ name: s, itemType: 'combo_member', price: 0, quantity: 1 }));
      else items = manualRows.filter(r => !!r.name).map(r => ({ ...r, price: parseFloat(r.price) || 0, itemType: 'manual' }));

      const bookingData = {
        customerId: currentCustomerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        address: customer.address,
        serviceTitle: entryMode === 'combo' ? 'Combo Service Package' : (items[0]?.name || 'Custom Service'),
        items,
        pricingMode: entryMode,
        dateTime: schedule.date,
        timeSlot: schedule.time,
        totalPrice: totals.total,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      await getOrCreateInvoice(db, bookingRef.id, 'booking', bookingData);

      toast({ title: "Booking Created" });
      router.push('/admin/bookings');
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
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Service Intake</h1>
        </div>
        <Button onClick={handleCreateBooking} disabled={isSubmitting} className="h-9 px-8 rounded-lg font-black uppercase text-[10px] bg-primary gap-2">
          {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Deploy Booking</>}
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
        <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><UserIcon size={12}/> Client Identity</CardTitle>
          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border">
             <Label className="text-[8px] font-black uppercase text-primary">New Client</Label>
             <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <Label className="text-[9px] font-bold text-gray-400 uppercase">Name</Label>
              {isNewCustomer ? <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9 font-bold" /> : (
                <Select value={customer.id} onValueChange={(val) => {
                  const c = clients?.find(i => i.id === val);
                  if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', address: c.address || '' });
                }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Search..." /></SelectTrigger>
                  <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Phone</Label><Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Date</Label><Input type="date" value={schedule.date} onChange={e => setSchedule({...schedule, date: e.target.value})} className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Time</Label>
              <Select value={schedule.time} onValueChange={v => setSchedule({...schedule, time: v})}>
                <SelectTrigger className="h-9 text-xs font-black uppercase"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="8AM - 12PM">Morning</SelectItem><SelectItem value="12PM - 4PM">Afternoon</SelectItem><SelectItem value="4PM - 8PM">Evening</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 space-y-1.5"><Label className="text-[9px] font-bold text-gray-400 uppercase">Address</Label><Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100">
        <CardHeader className="bg-gray-50/50 p-3 px-5 border-b"><CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Wrench size={12}/> Service Protocol ({entryMode.toUpperCase()})</CardTitle></CardHeader>
        <CardContent className="p-5">
          {entryMode === 'dynamic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
                <div className="md:col-span-7 space-y-1">
                  <Label className="text-[9px] font-bold text-gray-400 uppercase">Select Service</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Choose..." /></SelectTrigger>
                    <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1"><Label className="text-[9px] font-bold text-gray-400 uppercase">Qty</Label><Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9" /></div>
                <Button type="button" onClick={handleAddDynamic} className="md:col-span-2 h-9 bg-blue-600 font-bold text-[10px] uppercase shadow-md"><Plus size={14} /> Add</Button>
              </div>
              <Table><TableHeader><TableRow><TableHead className="text-[10px] uppercase">Name</TableHead><TableHead className="text-[10px] uppercase text-center">Qty</TableHead><TableHead className="text-[10px] uppercase text-right">Price</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>{dynamicItems.map(i => (<TableRow key={i.id}><TableCell className="font-bold text-[11px] uppercase">{i.name}</TableCell><TableCell className="text-center text-[11px]">{i.quantity} {i.unit}</TableCell><TableCell className="text-right font-black text-[11px]">৳{(i.price * i.quantity).toLocaleString()}</TableCell><TableCell><button onClick={() => setDynamicItems(dynamicItems.filter(item => item.id !== i.id))} className="text-rose-500"><Trash2 size={14}/></button></TableCell></TableRow>))}</TableBody>
              </Table>
            </div>
          )}

          {entryMode === 'combo' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Included Services (Manual Type)</Label>
                {comboServices.map((s, idx) => (
                  <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2">
                    <Input value={s} onChange={e => updateComboRow(idx, e.target.value)} placeholder="Type service name..." className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs" />
                    {comboServices.length > 1 && <button onClick={() => removeComboRow(idx)} className="text-rose-400 hover:text-rose-600"><X size={18}/></button>}
                  </div>
                ))}
                <Button type="button" onClick={addComboRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><Plus size={14} /> Add Service Name</Button>
              </div>
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                 <Label className="text-[10px] font-black uppercase text-indigo-700">Set One Combined Price (৳)</Label>
                 <Input type="number" value={comboTotalPrice} onChange={e => setComboTotalPrice(e.target.value)} className="h-12 w-48 bg-white border-none rounded-xl font-black text-lg text-indigo-700 text-right" />
              </div>
            </div>
          )}

          {entryMode === 'manual' && (
            <div className="space-y-4">
              <Table><TableHeader><TableRow><TableHead className="text-[10px] uppercase">Service Name</TableHead><TableHead className="text-[10px] uppercase text-center w-24">Rate</TableHead><TableHead className="text-[10px] uppercase text-center w-20">Qty</TableHead><TableHead className="text-[10px] uppercase text-center w-24">Unit</TableHead><TableHead className="text-[10px] uppercase text-right w-28">Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>{manualRows.map((row, idx) => (
                  <TableRow key={idx}><TableCell><Input value={row.name} onChange={e => updateManualRow(idx, 'name', e.target.value)} className="h-8 text-xs font-bold bg-gray-50 border-none" placeholder="Service Name" /></TableCell>
                    <TableCell><Input type="number" value={row.price} onChange={e => updateManualRow(idx, 'price', e.target.value)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                    <TableCell><Input type="number" value={row.quantity} onChange={e => updateManualRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                    <TableCell><Select value={row.unit} onValueChange={v => updateManualRow(idx, 'unit', v)}><SelectTrigger className="h-8 text-[10px] uppercase font-black"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Qty">Qty</SelectItem><SelectItem value="Sqft">Sqft</SelectItem><SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="Room">Room</SelectItem></SelectContent></Select></TableCell>
                    <TableCell className="text-right font-black text-xs text-primary">৳{((parseFloat(row.price) || 0) * row.quantity).toLocaleString()}</TableCell>
                    <TableCell><button onClick={() => removeManualRow(idx)} className="text-rose-400"><X size={16}/></button></TableCell></TableRow>))}</TableBody>
              </Table>
              <Button type="button" onClick={addManualRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><ListPlus size={14} /> Add Row</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-slate-50 border p-6 rounded-2xl flex justify-between items-end">
        <div className="flex flex-col"><span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Grand Final bill</span><span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toLocaleString()}</span></div>
        <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
      </div>
    </div>
  );
}
