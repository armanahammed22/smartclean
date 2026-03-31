'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  CalendarIcon, 
  User, 
  Clock, 
  Phone, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Wallet, 
  ShoppingCart, 
  X,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required").optional().or(z.literal('')),
  address: z.string().min(10, "Address required"),
  date: z.date({ required_error: "Please select a date" }).optional(),
  time: z.string().optional(),
  paymentCategory: z.enum(['cod', 'online']).default('cod'),
  onlineMethod: z.string().optional(),
  notes: z.string().optional(),
  otp: z.string().optional(),
  deliveryOption: z.string().optional()
});

export function CheckoutModal() {
  const { items, subtotal, smartSubtotal, clearCart, isCheckoutOpen, setCheckoutOpen } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc(settingsRef);

  const hasServices = items.some(i => i.itemType === 'service');
  
  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), orderBy('amount', 'asc')) : null, [db]);
  const { data: allDeliveryOptions } = useCollection(deliveryQuery);
  
  const deliveryOptions = React.useMemo(() => {
    return allDeliveryOptions?.filter(opt => opt.isEnabled === true) || [];
  }, [allDeliveryOptions]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: user?.displayName || "", 
      phone: "", 
      email: user?.email || "", 
      address: "", 
      date: undefined,
      time: "8AM - 12PM", 
      paymentCategory: 'cod',
      onlineMethod: "",
      notes: "",
      otp: "",
      deliveryOption: ""
    },
  });

  useEffect(() => {
    if (isCheckoutOpen && user) {
      form.setValue('name', user.displayName || "");
      form.setValue('email', user.email || "");
    }
  }, [isCheckoutOpen, user, form]);

  const selectedDeliveryId = form.watch('deliveryOption');
  const selectedDelivery = deliveryOptions?.find(d => d.id === selectedDeliveryId);
  const deliveryCharge = !hasServices ? (Number(selectedDelivery?.amount) || 0) : 0;

  const smartSavings = subtotal - smartSubtotal;
  const tax = Number((smartSubtotal * 0.08).toFixed(2));
  const finalTotal = Number((smartSubtotal + tax + deliveryCharge).toFixed(2));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db || !auth) return;
    setIsSubmitting(true);
    try {
      const collName = hasServices ? 'bookings' : 'orders';
      const docRef = await addDoc(collection(db, collName), {
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email,
        address: values.address,
        dateTime: values.date ? values.date.toISOString() : null,
        timeSlot: values.time || null,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: smartSubtotal,
        tax,
        deliveryCharge,
        totalPrice: finalTotal,
        paymentMethod: values.paymentCategory === 'cod' ? 'Cash on Delivery' : 'Online',
        createdAt: new Date().toISOString(),
        status: 'New'
      });
      clearCart();
      setCheckoutOpen(false);
      router.push(`/order-success?id=${docRef.id}&type=${hasServices ? 'booking' : 'order'}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 border-none rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#F8FAFC] z-[200]">
        <DialogHeader className="p-4 md:p-6 bg-[#081621] text-white shrink-0 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <ShoppingCart className="text-primary" size={20} /> {hasServices ? 'Finalize Booking' : 'Secure Checkout'}
            </DialogTitle>
            <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
              Please provide your information to complete the order
            </DialogDescription>
          </div>
          <button onClick={() => setCheckoutOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </DialogHeader>
        
        <div className="flex flex-col h-[80vh] lg:h-auto lg:max-h-[85vh] relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:grid lg:grid-cols-5 pb-24 md:pb-0">
            {/* Form Column */}
            <div className="lg:col-span-3 p-4 md:p-8 bg-white overflow-visible">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 border-b pb-2"><User size={14} className="text-primary" /> Recipient Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" {...field} className="h-12 md:h-14 rounded-2xl bg-gray-50 border-none shadow-inner font-bold focus:bg-white transition-all" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</FormLabel>
                          <FormControl><Input placeholder="01XXXXXXXXX" {...field} className="h-12 md:h-14 rounded-2xl bg-gray-50 border-none shadow-inner font-bold focus:bg-white transition-all" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Delivery Address</FormLabel>
                        <FormControl><Textarea placeholder="House, Road, Area, District" {...field} className="bg-gray-50 border-none rounded-2xl min-h-[100px] shadow-inner p-4 font-medium focus:bg-white transition-all" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Optimized Date & Time UI */}
                  {hasServices && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 border-b pb-2"><Clock size={14} className="text-primary" /> Arrival Schedule</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem className="space-y-1.5 flex flex-col">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preferred Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("h-12 md:h-14 w-full bg-gray-50 justify-between gap-2 font-bold rounded-2xl border-none shadow-inner px-6 hover:bg-gray-100", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Select Date</span>}
                                    <CalendarIcon size={18} className="text-primary opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl z-[250]" align="center" side="bottom" collisionPadding={20}>
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="time" render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preferred Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 md:h-14 bg-gray-50 border-none rounded-2xl shadow-inner px-6">
                                  <SelectValue placeholder="Arrival Window" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl border-none shadow-2xl z-[250]">
                                <SelectItem value="8AM - 12PM" className="py-3 font-bold">Morning (8AM - 12PM)</SelectItem>
                                <SelectItem value="12PM - 4PM" className="py-3 font-bold">Afternoon (12PM - 4PM)</SelectItem>
                                <SelectItem value="4PM - 8PM" className="py-3 font-bold">Evening (4PM - 8PM)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full hidden md:flex h-16 rounded-[2rem] shadow-2xl uppercase bg-primary hover:bg-primary/90 text-white font-black text-sm gap-3 transition-all active:scale-95 shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <>{hasServices ? 'Place Service Booking' : 'Confirm Order Now'} <ArrowRight size={20} /></>}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Summary Column */}
            <div className="lg:col-span-2 bg-[#F9FAFB] p-4 md:p-8 border-l border-gray-100 flex flex-col gap-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#081621] flex items-center gap-2"><ShoppingCart size={14}/> Items in cart</h3>
                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto no-scrollbar">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-start gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase text-[#081621] truncate leading-tight">{item.name}</p>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Quantity: {item.quantity}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 pt-6 border-t-2 border-dashed border-gray-200 mt-auto">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                {smartSavings > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-blue-600"><span>Smart Discount</span><span>-৳{smartSavings.toLocaleString()}</span></div>}
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>VAT (8%)</span><span>৳{tax.toLocaleString()}</span></div>
                {deliveryCharge > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-primary"><span>Shipping</span><span>৳{deliveryCharge.toLocaleString()}</span></div>}
                
                <div className="pt-6 flex justify-between items-end border-t border-gray-100 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Final Total</span>
                    <span className="text-3xl font-black text-[#081621] tracking-tighter leading-none">৳{finalTotal.toLocaleString()}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] px-3 py-1 rounded-md uppercase tracking-widest shadow-sm">PAYABLE</Badge>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-4 bg-white/50 rounded-2xl border border-dashed border-gray-200 flex items-center gap-3">
                <ShieldCheck className="text-green-600" size={24} />
                <p className="text-[9px] font-bold text-gray-500 uppercase leading-tight">Your payment and data are protected with SSL encryption.</p>
              </div>
            </div>
          </div>

          {/* 📱 Mobile Sticky Action Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-4 z-[210] pb-safe-offset-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Final Amount</span>
              <span className="text-2xl font-black text-primary tracking-tighter">৳{finalTotal.toLocaleString()}</span>
            </div>
            <Button onClick={form.handleSubmit(onSubmit)} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <>{hasServices ? 'Place Booking' : 'Order Now'}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}