
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
  Edit2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PricingMode } from '@/types';

export default function CreateManualBookingPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing Mode
  const [pricingMode, setPricingMode] = useState<PricingMode>('dynamic');

  // Feature Modes
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [schedule, setSchedule] = useState({ date: '', time: '8AM - 12PM' });
  
  // Cart Items State
  const [items, setItems] = useState<any[]>([]);
  const [customPrice, setCustomPrice] = useState('');
  
  // Selection Helpers
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState(1);

  // DB Fetch
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const packagesQuery = useMemoFirebase(() => db ? query(collection(db, 'service_packages'), where('status', '==', 'Active')) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  
  const { data: servicesRaw } = useCollection(servicesQuery);
  const { data: packages } = useCollection(packagesQuery);
  const { data: customersRaw } = useCollection(customersQuery);

  const services = useMemo(() => {
    return servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [customersRaw]);

  const handleAddItem = () => {
    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    const newItem = {
      id: service.id + '-' + Date.now(),
      serviceId: service.id,
      name: service.title,
      price: service.basePrice,
      quantity: selectedQty,
      unit: service.pricingType === 'sqft' ? 'Sqft' : 'Pcs',
      itemType: 'service'
    };

    setItems([...items, newItem]);
    setSelectedServiceId('');
    setSelectedQty(1);
  };

  const handleAddPackage = (pkgId: string) => {
    const pkg = packages?.find(p => p.id === pkgId);
    if (!pkg) return;

    // Reset items and switch to combo mode
    const pkgItems = pkg.serviceIds.map(sid => {
      const s = services.find(srv => srv.id === sid);
      return {
        id: (s?.id || sid) + '-' + Date.now(),
        serviceId: s?.id || sid,
        name: s?.title || pkg.name,
        price: s?.basePrice || 0,
        quantity: 1,
        unit: 'Qty',
        itemType: 'service'
      };
    });

    setItems(pkgItems);
    setPricingMode('combo');
    setCustomPrice(pkg.price.toString());
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const totals = useMemo(() => {
    const calculatedSubtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    let finalTotal = calculatedSubtotal;
    
    if (pricingMode === 'combo' || pricingMode === 'manual') {
      finalTotal = parseFloat(customPrice) || 0;
    }

    return { calculatedSubtotal, finalTotal };
  }, [items, pricingMode, customPrice]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    if (items.length === 0 && pricingMode !== 'manual') {
      toast({ variant: "destructive", title: "Missing Services", description: "Please add at least one service." });
      return;
    }

    if (!customer.name || !customer.phone || !customer.address || !schedule.date) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Client details and date are required." });
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
          await setDoc(newRef, {
            uid: newRef.id,
            name: customer.name,
            phone: phone,
            address: customer.address,
            role: 'customer',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          currentCustomerId = newRef.id;
        } else {
          currentCustomerId = snap.docs[0].id;
        }
      }

      const bookingData = {
        customerId: currentCustomerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        address: customer.address,
        serviceTitle: pricingMode === 'combo' ? 'Combo Cleaning Package' : (items.length === 1 ? items[0].name : 'Mixed Service Order'),
        items,
        pricingMode,
        manualPrice: pricingMode === 'manual' ? totals.finalTotal : null,
        comboPrice: pricingMode === 'combo' ? totals.finalTotal : null,
        dateTime: schedule.date,
        timeSlot: schedule.time,
        subtotal: pricingMode === 'dynamic' ? totals.calculatedSubtotal : totals.finalTotal,
        totalPrice: totals.finalTotal,
        status: 'New',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Auto-generate invoice
      await getOrCreateInvoice(db, bookingRef.id, 'booking', bookingData);

      toast({ title: "Booking Created", description: "Synced to operational ledger." });
      router.push('/admin/bookings');
    } catch (e) {
      toast({ variant: "destructive", title: "Process Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 min-w-0 -mt-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">Service Intake Hub</h1>
        </div>
        <Button onClick={handleCreateBooking} disabled={isSubmitting} className="h-9 px-10 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
          {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Deploy Booking</>}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Pricing Mode Selector */}
        <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border shadow-sm">
           <button 
            type="button" 
            onClick={() => setPricingMode('dynamic')}
            className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all", pricingMode === 'dynamic' ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}
           >
             <Zap size={14}/> Dynamic
           </button>
           <button 
            type="button" 
            onClick={() => setPricingMode('combo')}
            className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all", pricingMode === 'combo' ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}
           >
             <Layers size={14}/> Combo
           </button>
           <button 
            type="button" 
            onClick={() => setPricingMode('manual')}
            className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all", pricingMode === 'manual' ? "bg-amber-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}
           >
             <Edit2 size={14}/> Manual
           </button>
        </div>

        {/* Customer Identity Row */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><UserIcon size={12}/> Client Registry</CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-primary">New Client</Label>
               <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Customer Name</Label>
                {isNewCustomer ? (
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9 font-bold" placeholder="Full Name" />
                ) : (
                  <Select value={customer.id} onValueChange={(val) => {
                    const c = clients?.find(i => i.id === val);
                    if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', address: c.address || '' });
                  }}>
                    <SelectTrigger className="h-9 bg-white border-gray-200">
                      <SelectValue placeholder="Search existing..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Mobile Number</Label>
                <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" placeholder="01XXXXXXXXX" disabled={!isNewCustomer && customer.id !== ''} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Service Date</Label>
                <Input type="date" value={schedule.date} onChange={e => setSchedule({...schedule, date: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Arrival Window</Label>
                <Select value={schedule.time} onValueChange={v => setSchedule({...schedule, time: v})}>
                  <SelectTrigger className="h-9 bg-white border-gray-200 text-xs font-black uppercase"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8AM - 12PM" className="text-xs uppercase font-bold">Morning (8-12)</SelectItem>
                    <SelectItem value="12PM - 4PM" className="text-xs uppercase font-bold">Afternoon (12-4)</SelectItem>
                    <SelectItem value="4PM - 8PM" className="text-xs uppercase font-bold">Evening (4-8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Site Address</Label>
                <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9" placeholder="House, Road, Area" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Selection Row */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2">
               <Wrench size={12}/> Service Definition (Mode: {pricingMode.toUpperCase()})
            </CardTitle>
            {pricingMode === 'combo' && (
               <Select onValueChange={handleAddPackage}>
                  <SelectTrigger className="h-7 w-48 bg-white border-indigo-200 text-indigo-600 text-[9px] font-black uppercase rounded-lg">
                    <SelectValue placeholder="Quick Import Package..." />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map(p => <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold">{p.name}</SelectItem>)}
                  </SelectContent>
               </Select>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
              <div className="md:col-span-7 space-y-1">
                <Label className="text-[9px] font-bold uppercase text-gray-400">Select Service</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger className="h-9 bg-white border-gray-200">
                    <SelectValue placeholder="Choose service..." />
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
              <div className="md:col-span-2">
                <Button type="button" onClick={handleAddItem} className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase gap-2 shadow-md">
                  <Plus size={14} /> Add Item
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-none">
                    <TableHead className="text-[9px] font-black uppercase py-3">Item Name</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-24">Qty/Area</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-28">Normal Price</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50/30">
                      <TableCell className="py-3 font-bold text-[11px] text-gray-900 uppercase">{item.name}</TableCell>
                      <TableCell className="text-center text-[11px] font-black">{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-right font-black text-[11px] text-gray-400">
                        {pricingMode === 'dynamic' ? `৳${(item.price * item.quantity).toLocaleString()}` : '---'}
                      </TableCell>
                      <TableCell><button type="button" onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600"><Trash2 size={14}/></button></TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-300 italic text-[10px] uppercase tracking-widest">Add services to start booking.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Billing Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
           <div className="lg:col-span-7 space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Special Job Instructions</Label>
              <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="Detailed address and scope..." className="h-32 bg-white rounded-xl border-gray-100 shadow-inner p-4" />
           </div>
           <div className="lg:col-span-5 bg-slate-50 border border-gray-100 p-6 rounded-2xl space-y-5">
              {pricingMode === 'dynamic' ? (
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Auto-Calculated Total</span>
                  <span className="text-gray-900">৳{totals.calculatedSubtotal.toLocaleString()}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    <span>Base Sum</span>
                    <span className="text-gray-400 line-through">৳{totals.calculatedSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-700 ml-1">
                        {pricingMode === 'combo' ? 'Fixed Combo Price' : 'Manual Override Price'} (৳)
                    </Label>
                    <Input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="0.00" className="h-12 bg-white border-none rounded-xl font-black text-lg text-indigo-700 shadow-inner" />
                  </div>
                </div>
              )}
              
              <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Net Payable Bill</span>
                    <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.finalTotal.toLocaleString()}</span>
                 </div>
                 <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
