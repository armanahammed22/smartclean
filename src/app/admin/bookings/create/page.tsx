'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
  Calendar, 
  Search, 
  User, 
  MapPin, 
  Wrench, 
  Zap,
  CheckCircle2,
  Clock,
  Check,
  ChevronRight,
  Wallet,
  ShieldCheck,
  Package,
  Layers,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrCreateInvoice } from '@/lib/invoice-utils';

export default function CreateManualBookingPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer & Schedule Data
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    date: '', 
    time: '8AM - 12PM',
    notes: '' 
  });
  
  // Selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [manualDiscount, setManualDiscount] = useState(0);

  // DB Fetch
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services')) : null, [db]);
  
  const { data: services, isLoading: sLoading } = useCollection(servicesQuery);
  const { data: allSubs } = useCollection(subsQuery);

  const selectedService = useMemo(() => services?.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
  const addOnOptions = useMemo(() => allSubs?.filter(sub => sub.mainServiceId === selectedServiceId && sub.isAddOnEnabled), [allSubs, selectedServiceId]);

  const basePrice = selectedService?.basePrice || 0;
  const addOnPrice = addOnOptions?.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0) || 0;
  
  const subtotal = basePrice + addOnPrice;
  const tax = 0; // VAT confirmed 0
  const total = subtotal + tax - manualDiscount;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!selectedServiceId) {
      toast({ variant: "destructive", title: "Service Required", description: "Please select a main service." });
      return;
    }
    if (!formData.name || !formData.phone || !formData.address || !formData.date) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Customer name, phone, address and date are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        address: formData.address,
        serviceId: selectedServiceId,
        serviceTitle: selectedService?.title,
        items: [
          { id: selectedServiceId, name: selectedService?.title, price: basePrice, quantity: 1, itemType: 'service' },
          ...addOnOptions?.filter(a => selectedAddOnIds.includes(a.id)).map(a => ({ id: a.id, name: a.name, price: a.price, quantity: 1, itemType: 'service' })) || []
        ],
        dateTime: formData.date,
        timeSlot: formData.time,
        subtotal,
        tax,
        discount: manualDiscount,
        totalPrice: total,
        status: 'Assigned',
        paymentMethod: 'Manual Enrollment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Auto-generate invoice
      await getOrCreateInvoice(db, docRef.id, 'booking', bookingData);

      toast({ title: "Booking Created", description: "Manual booking and invoice generated successfully." });
      router.push('/admin/bookings');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create booking." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Service Intake</h1>
          <p className="text-muted-foreground text-[10px] md:text-sm font-bold uppercase tracking-widest mt-1">Manual Enrollment Terminal</p>
        </div>
      </div>

      <form onSubmit={handleCreateBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* 🛠️ SERVICE CONFIGURATION */}
          <Card className="border-none shadow-sm rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Wrench size={18} className="text-primary" /> Service Definition
              </CardTitle>
              <CardDescription className="text-white/40 font-bold uppercase text-[9px]">Select primary service and optional add-ons</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Choose Main Service</Label>
                <Select value={selectedServiceId} onValueChange={v => { setSelectedServiceId(v); setSelectedAddOnIds([]); }}>
                  <SelectTrigger className="h-14 bg-gray-50 border-none rounded-2xl font-bold text-sm shadow-inner">
                    <SelectValue placeholder="Search service catalog..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id} className="py-3 px-4 font-black uppercase text-[10px]">{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedServiceId && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-6">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Zap size={14} fill="currentColor" /> Available Customizations
                    </h4>
                    <Badge variant="outline" className="text-[8px] font-black uppercase h-5">{addOnOptions?.length || 0} Options</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addOnOptions?.map(addon => (
                      <div 
                        key={addon.id} 
                        onClick={() => toggleAddOn(addon.id)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          selectedAddOnIds.includes(addon.id) ? "border-primary bg-primary/5 shadow-inner" : "border-gray-50 bg-white hover:border-primary/20"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-black text-[11px] uppercase truncate leading-tight text-gray-900">{addon.name}</p>
                          <p className="font-black text-primary text-[10px] mt-1">+৳{addon.price}</p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                          selectedAddOnIds.includes(addon.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                        )}>
                          {selectedAddOnIds.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                        </div>
                      </div>
                    ))}
                    {addOnOptions?.length === 0 && <p className="col-span-full py-6 text-center text-[10px] font-bold text-gray-400 uppercase italic">No add-ons available for this service.</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 👤 CLIENT & LOGISTICS */}
          <Card className="border-none shadow-sm rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <User size={18} className="text-primary" /> Client & Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Legal Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Recipient Name" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contact Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Arrival Window</Label>
                  <Select value={formData.time} onValueChange={v => setFormData({...formData, time: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-black text-[10px] uppercase shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="8AM - 12PM" className="font-bold text-[10px] uppercase">Morning (8AM - 12PM)</SelectItem>
                      <SelectItem value="12PM - 4PM" className="font-bold text-[10px] uppercase">Afternoon (12PM - 4PM)</SelectItem>
                      <SelectItem value="4PM - 8PM" className="font-bold text-[10px] uppercase">Evening (4PM - 8PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-primary" size={18} />
                  <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="House, Road, Block, Area..." className="min-h-[120px] pl-12 bg-gray-50 border-none rounded-[2rem] p-6 font-medium shadow-inner focus:bg-white transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 💰 REAL-TIME BILLING SIDEBAR */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border-t-[12px] border-indigo-600">
            <CardHeader className="p-8 border-b bg-gray-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-[#081621]">Bill Calculation</CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest mt-1">Live configuration metrics</CardDescription>
              </div>
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20"><Wallet size={20}/></div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Base Premium Service</span>
                  <span className="text-gray-900">৳{basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Selected Add-ons</span>
                  <span className="text-gray-900">৳{addOnPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>VAT (0%)</span>
                  <span className="text-gray-900">৳{tax.toLocaleString()}</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-dashed border-gray-200">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-rose-600 ml-1">Manual Discount Override (৳)</Label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600" size={14} />
                      <Input 
                        type="number" 
                        value={manualDiscount} 
                        onChange={e => setManualDiscount(parseFloat(e.target.value) || 0)} 
                        className="h-12 pl-10 bg-rose-50/50 border-rose-100 border-2 font-black text-lg text-rose-600 rounded-2xl shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t-4 border-dashed border-gray-100 flex flex-col gap-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-1">Total Authorized Payable</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-indigo-600 tracking-tighter">৳{total.toLocaleString()}</span>
                    <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[10px]">BDT</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                  <ShieldCheck size={24} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-indigo-800 leading-relaxed uppercase">
                    Verification Protocol Active. This booking will be created with "Assigned" status and an immediate professional invoice.
                  </p>
                </div>
                <Button 
                  onClick={handleCreateBooking}
                  disabled={isSubmitting}
                  className="w-full h-16 md:h-20 rounded-[2rem] font-black text-2xl bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-tight shadow-2xl shadow-indigo-600/30 gap-4 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={28} /> Deploy Booking</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
