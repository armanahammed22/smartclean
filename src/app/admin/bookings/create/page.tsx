
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, doc, increment, writeBatch, where, getDocs, limit, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Wrench, 
  Zap,
  CheckCircle2,
  Clock,
  Check,
  Wallet,
  Calculator,
  ShieldCheck,
  X,
  PackagePlus,
  UserPlus,
  ShoppingCart,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrCreateInvoice } from '@/lib/invoice-utils';

export default function CreateManualBookingPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature Modes
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isManualItem, setIsManualItem] = useState(false);

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [schedule, setSchedule] = useState({ date: '', time: '8AM - 12PM' });
  
  // Selection state
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [manualPrice, setManualPrice] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualUnit, setManualUnit] = useState('Qty');

  // DB Fetch
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), orderBy('title', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), where('status', '==', 'Active')) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  
  const { data: services } = useCollection(servicesQuery);
  const { data: allSubs } = useCollection(subsQuery);
  const { data: customersRaw } = useCollection(customersQuery);

  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [customersRaw]);
  const selectedService = useMemo(() => services?.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
  const addOnOptions = useMemo(() => allSubs?.filter(sub => sub.mainServiceId === selectedServiceId && sub.isAddOnEnabled), [allSubs, selectedServiceId]);

  const basePrice = isManualItem ? (parseFloat(manualPrice) || 0) : (selectedService?.basePrice || 0);
  const addOnPrice = addOnOptions?.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0) || 0;
  
  const subtotal = basePrice + addOnPrice;
  const total = subtotal;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    if (isManualItem && !manualTitle) {
        toast({ variant: "destructive", title: "Missing Title", description: "Manual service name is required." });
        return;
    }

    if (!isManualItem && !selectedServiceId) {
      toast({ variant: "destructive", title: "Service Required", description: "Please select a main service." });
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
        serviceId: isManualItem ? 'manual' : selectedServiceId,
        serviceTitle: isManualItem ? manualTitle : selectedService?.title,
        items: [
          { id: isManualItem ? 'manual' : selectedServiceId, name: isManualItem ? manualTitle : selectedService?.title, price: basePrice, quantity: 1, itemType: 'service', unit: isManualItem ? manualUnit : (selectedService?.pricingType || 'Qty') },
          ...addOnOptions?.filter(a => selectedAddOnIds.includes(a.id)).map(a => ({ id: a.id, name: a.name, price: a.price, quantity: 1, itemType: 'service' })) || []
        ],
        dateTime: schedule.date,
        timeSlot: schedule.time,
        subtotal,
        tax: 0,
        totalPrice: total,
        status: 'New',
        paymentMethod: 'Manual Enrollment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Auto-generate invoice
      await getOrCreateInvoice(db, bookingRef.id, 'booking', bookingData);

      toast({ title: "Booking Created", description: "Professional record synced to ledger." });
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
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">Service Intake</h1>
        </div>
        <Button onClick={handleCreateBooking} disabled={isSubmitting} className="h-9 px-10 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
          {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Deploy Booking</>}
        </Button>
      </div>

      <div className="space-y-4">
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

        {/* Service Matrix Row */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Wrench size={12}/> Service Definition</CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-primary">Manual Entry</Label>
               <Switch checked={isManualItem} onCheckedChange={setIsManualItem} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-2xl border">
               {!isManualItem ? (
                 <div className="md:col-span-12 space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Main Service</Label>
                   <Select value={selectedServiceId} onValueChange={v => { setSelectedServiceId(v); setSelectedAddOnIds([]); }}>
                     <SelectTrigger className="h-11 md:h-12 bg-white border-gray-200 rounded-xl font-bold">
                       <SelectValue placeholder="Search service catalog..." />
                     </SelectTrigger>
                     <SelectContent>
                       {services?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold py-3">{s.title}</SelectItem>)}
                     </SelectContent>
                   </Select>
                 </div>
               ) : (
                 <>
                   <div className="md:col-span-6 space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400">Manual Service Name</Label>
                     <Input value={manualTitle} onChange={e => setManualTitle(e.target.value)} className="h-11 md:h-12 bg-white rounded-xl font-bold" />
                   </div>
                   <div className="md:col-span-3 space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400">Price Override (৳)</Label>
                     <Input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} className="h-11 md:h-12 bg-white rounded-xl font-black text-primary shadow-inner" />
                   </div>
                   <div className="md:col-span-3 space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400">Unit/Area</Label>
                     <Select value={manualUnit} onValueChange={setManualUnit}>
                       <SelectTrigger className="h-11 md:h-12 bg-white rounded-xl font-bold text-xs"><SelectValue/></SelectTrigger>
                       <SelectContent>
                         {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-bold uppercase">{u}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                 </>
               )}
             </div>

             {selectedServiceId && (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Zap size={14} fill="currentColor"/> Power-Up Add-ons</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {addOnOptions?.map(addon => (
                      <div 
                        key={addon.id} 
                        onClick={() => toggleAddOn(addon.id)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          selectedAddOnIds.includes(addon.id) ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-gray-50/50 hover:border-gray-200"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-black text-[10px] uppercase truncate leading-tight">{addon.name}</p>
                          <p className="font-black text-primary text-[9px] mt-1">+৳{addon.price}</p>
                        </div>
                        {selectedAddOnIds.includes(addon.id) && <CheckCircle2 size={16} className="text-primary" />}
                      </div>
                    ))}
                    {addOnOptions?.length === 0 && <p className="col-span-full py-6 text-center text-[10px] font-bold text-gray-300 uppercase">No add-ons for this category.</p>}
                 </div>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Billing Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
           <div className="lg:col-span-7 space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Special Job Instructions</Label>
              <Textarea value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="Detailed address and scope..." className="h-32 bg-white rounded-xl border-gray-100 shadow-inner p-4" />
           </div>
           <div className="lg:col-span-5 bg-slate-50 border border-gray-100 p-6 rounded-2xl space-y-5">
              <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Base Service</span>
                <span className="text-gray-900">৳{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Total Add-ons</span>
                <span className="text-gray-900">৳{addOnPrice.toLocaleString()}</span>
              </div>
              <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Net Final Bill</span>
                    <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{total.toLocaleString()}</span>
                 </div>
                 <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
