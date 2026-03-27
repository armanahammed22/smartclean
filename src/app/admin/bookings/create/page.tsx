
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
  Check
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
  const tax = Number((subtotal * 0.08).toFixed(2));
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
        paymentMethod: 'Cash in Hand (Manual)',
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
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Manual Booking</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">SaaS Service Intake</p>
        </div>
      </div>

      <form onSubmit={handleCreateBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Service Selector */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Wrench size={18} className="text-primary" /> Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Main Service</Label>
                <Select value={selectedServiceId} onValueChange={v => { setSelectedServiceId(v); setSelectedAddOnIds([]); }}>
                  <SelectTrigger className="h-14 bg-gray-50 border-none rounded-2xl font-bold">
                    <SelectValue placeholder="Choose a service..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {services?.map(s => <SelectItem key={s.id} value={s.id} className="font-bold uppercase text-[10px]">{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {selectedServiceId && addOnOptions && addOnOptions.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Available Add-ons</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addOnOptions.map(addon => (
                      <div 
                        key={addon.id} 
                        onClick={() => toggleAddOn(addon.id)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          selectedAddOnIds.includes(addon.id) ? "border-primary bg-primary/5 shadow-inner" : "border-gray-50 bg-white hover:border-primary/20"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-black text-xs uppercase truncate leading-tight">{addon.name}</p>
                          <p className="font-black text-primary text-[10px] mt-1">+৳{addon.price}</p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                          selectedAddOnIds.includes(addon.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                        )}>
                          {selectedAddOnIds.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer & Schedule */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Client & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Karim Ahmed" className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Booking Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Time Slot</Label>
                  <Select value={formData.time} onValueChange={v => setFormData({...formData, time: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="8AM - 12PM">Morning (8AM-12PM)</SelectItem>
                      <SelectItem value="12PM - 4PM">Afternoon (12PM-4PM)</SelectItem>
                      <SelectItem value="4PM - 8PM">Evening (4PM-8PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Address</Label>
                <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="House, Road, Area" className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4 pt-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
          {/* Summary Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white border-t-8 border-indigo-600">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Base Price</span>
                  <span className="text-gray-900">৳{basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Add-ons</span>
                  <span className="text-gray-900">৳{addOnPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>VAT (8%)</span>
                  <span className="text-gray-900">৳{tax.toLocaleString()}</span>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-black uppercase text-primary ml-1">Admin Discount (Manual)</Label>
                  <Input 
                    type="number" 
                    value={manualDiscount} 
                    onChange={e => setManualDiscount(parseFloat(e.target.value) || 0)} 
                    className="h-10 bg-gray-50 border-none font-black text-xs shadow-inner rounded-xl"
                  />
                </div>
                <div className="pt-6 border-t-4 border-dashed border-gray-100 flex flex-col gap-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Payable</p>
                  <p className="text-5xl font-black text-indigo-600 tracking-tighter">৳{total.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-indigo-600 mt-0.5" />
                  <p className="text-[10px] font-bold text-indigo-800 leading-relaxed uppercase">
                    Booking will be created with "Assigned" status. Official invoice will be sent to the client.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 md:h-20 rounded-2xl font-black text-2xl bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-tight shadow-xl shadow-indigo-600/20 gap-3 active:scale-95 transition-transform"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Confirm Booking</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
