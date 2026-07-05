"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  User, 
  MapPin, 
  CheckCircle2, 
  ShoppingCart, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Zap, 
  ShieldCheck,
  Smartphone,
  Wallet
} from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, query, orderBy, doc, increment, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/public-layout';
import { trackEvent } from '@/lib/tracking';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Please provide a complete address"),
  date: z.date({ required_error: "Please select a date" }).optional(),
  time: z.string().optional(),
  paymentMethod: z.string().min(1, "Required"),
  deliveryOption: z.string().optional(),
  notes: z.string().optional(),
});

function CheckoutContent() {
  const { items, subtotal, smartSubtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const hasServices = items.some(i => i.itemType === 'service');

  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), orderBy('amount', 'asc')) : null, [db]);
  const { data: allDeliveryOptions } = useCollection(deliveryQuery);
  const deliveryOptions = allDeliveryOptions?.filter(opt => opt.isEnabled === true) || [];

  useEffect(() => {
    setMounted(true);
    if (items.length > 0) {
      trackEvent('InitiateCheckout', { 
        value: subtotal, 
        currency: 'BDT',
        content_ids: items.map(i => i.id)
      });
    }
  }, [items, subtotal]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
      phone: "",
      email: user?.email || "",
      address: "",
      paymentMethod: "cod",
      date: undefined,
      time: "8AM - 12PM",
      deliveryOption: "",
      notes: "",
    },
  });

  const selectedDeliveryId = form.watch('deliveryOption');
  const selectedDelivery = deliveryOptions?.find(d => d.id === selectedDeliveryId);
  const deliveryCharge = !hasServices ? (Number(selectedDelivery?.amount) || 0) : 0;

  const tax = 0; // VAT confirmed 0
  const finalAmount = Number((smartSubtotal + tax + deliveryCharge).toFixed(2));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db) return;
    setIsSubmitting(true);
    
    try {
      const collName = hasServices ? 'bookings' : 'orders';
      const orderData = {
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email || null,
        address: values.address,
        dateTime: values.date ? values.date.toISOString() : null,
        timeSlot: values.time || null,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: smartSubtotal,
        tax,
        deliveryCharge,
        totalPrice: finalAmount,
        paymentMethod: values.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online',
        createdAt: new Date().toISOString(),
        status: 'New'
      };

      const batch = writeBatch(db);
      const orderRef = doc(collection(db, collName));
      batch.set(orderRef, orderData);

      // AUTOMATIC BOOKING/SALES COUNTER INCREMENT
      items.forEach(item => {
        if (item.itemType === 'service') {
          // Attempt to increment in both main services and sub_services
          // Firestore update on non-existent fields creates them, non-existent docs fail silently in batch
          batch.update(doc(db, 'services', item.id), { bookingCount: increment(1) });
          batch.update(doc(db, 'sub_services', item.id), { bookingCount: increment(1) });
        } else if (item.itemType === 'product') {
          batch.update(doc(db, 'products', item.id), { salesCount: increment(1) });
        }
      });

      await batch.commit();

      trackEvent('Purchase', {
        value: finalAmount,
        currency: 'BDT',
        content_ids: items.map(i => i.id),
        user_data: {
          email: values.email || undefined,
          phone: values.phone,
          external_id: user?.uid
        }
      });

      clearCart();
      router.push(`/order-success?id=${orderRef.id}&type=${hasServices ? 'booking' : 'order'}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#081621] font-headline italic">
            Secure <span className="text-primary">Checkout</span>
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2">Finish your order in seconds</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-8">
              
              {/* Customer Information */}
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white">
                <CardHeader className="bg-[#081621] text-white p-8 rounded-t-[2.5rem]">
                  <CardTitle className="text-xl font-black uppercase flex items-center gap-3"><User size={20}/> Customer Identity</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</FormLabel>
                        <FormControl><Input placeholder="Recipient Name" {...field} className="h-14 rounded-2xl bg-gray-50 border-none shadow-inner font-bold focus:bg-white transition-all"/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</FormLabel>
                        <FormControl><Input placeholder="01XXXXXXXXX" {...field} className="h-14 rounded-2xl bg-gray-50 border-none shadow-inner font-bold focus:bg-white transition-all"/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Delivery Address</FormLabel>
                      <FormControl><Textarea placeholder="House, Road, Area, District" {...field} className="min-h-[120px] rounded-2xl bg-gray-50 border-none shadow-inner p-6 font-medium focus:bg-white transition-all"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Date & Time Optimization for Services */}
              {hasServices && (
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white">
                  <CardHeader className="bg-primary/5 border-b p-8 rounded-t-[2.5rem]">
                    <CardTitle className="text-xl font-black uppercase flex items-center gap-3 text-primary"><Clock size={20}/> Preferred Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1 mb-1">Pick a Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("h-14 w-full bg-gray-50 border-none rounded-2xl font-bold shadow-inner flex justify-between items-center px-6 hover:bg-gray-100", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Select Date</span>}
                                  <CalendarIcon className="h-5 w-5 text-primary opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl z-[200]" align="start" side="bottom" sideOffset={4} collisionPadding={20}>
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Arrival Window</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 bg-gray-50 border-none rounded-2xl font-bold shadow-inner px-6">
                                <SelectValue placeholder="Select Time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                              <SelectItem value="8AM - 12PM" className="py-3 font-bold">Morning (8AM - 12PM)</SelectItem>
                              <SelectItem value="12PM - 4PM" className="py-3 font-bold">Afternoon (12PM - 4PM)</SelectItem>
                              <SelectItem value="4PM - 8PM" className="py-3 font-bold">Evening (4PM - 8PM)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full hidden lg:flex h-20 font-black text-2xl rounded-[2rem] shadow-2xl bg-green-600 hover:bg-green-700 text-white uppercase tracking-tight gap-4 transition-all active:scale-95 shadow-green-600/20" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={28} /> Complete Secure Checkout</>}
              </Button>
            </div>

            <div className="lg:col-span-5 w-full lg:sticky lg:top-24 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-green-600">
                <CardHeader className="p-8 border-b border-gray-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-[#081621]">Order Summary</CardTitle>
                  <ShoppingCart size={20} className="text-green-600 opacity-20" />
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between items-start gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase text-[#081621] truncate">{item.name}</p>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">QTY: {item.quantity}</span>
                          </div>
                          <span className="text-sm font-black text-gray-900 shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t-2 border-dashed border-gray-100 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-gray-900">৳{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>VAT (0%)</span>
                        <span className="text-gray-900">৳{tax.toLocaleString()}</span>
                      </div>
                      {deliveryCharge > 0 && (
                        <div className="flex justify-between text-xs font-black text-primary uppercase tracking-widest">
                          <span>Delivery</span>
                          <span>৳{deliveryCharge.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="pt-6 border-t-4 border-[#081621] flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-green-600 uppercase mb-1 tracking-widest">Total Payable</span>
                          <span className="text-4xl font-black text-[#081621] tracking-tighter">৳{finalAmount.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] px-4 py-1.5 rounded-lg uppercase">VAT INC.</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ShieldCheck size={20} /></div>
                  <span className="text-[9px] font-black uppercase leading-tight text-gray-600">Secure<br/>SSL Encrypted</span>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Zap size={20} /></div>
                  <span className="text-[9px] font-black uppercase leading-tight text-gray-600">Instant<br/>Confirmation</span>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-4 z-[1000] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Grand Total</span>
          <span className="text-2xl font-black text-primary tracking-tighter">৳{finalAmount.toLocaleString()}</span>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <>{hasServices ? 'Finalize Booking' : 'Order Now'}</>}
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PublicLayout minimalMobile={true}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>}>
        <CheckoutContent />
      </Suspense>
    </PublicLayout>
  );
}
