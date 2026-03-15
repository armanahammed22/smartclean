"use client";

import React, { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, Wallet, CreditCard, Smartphone, ShoppingCart, TicketPercent, CheckCircle2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Address required"),
  date: z.date().optional(),
  time: z.string().optional(),
  paymentMethod: z.string(),
  coupon: z.string().optional(),
  notes: z.string().optional(),
});

export function CheckoutModal() {
  const { items, subtotal, clearCart, isCheckoutOpen, setCheckoutOpen } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const hasServices = items.some(i => i.itemType === 'service');
  
  const methodsQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_methods'), where('isEnabled', '==', true)) : null, [db]);
  const { data: availableMethods } = useCollection(methodsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: user?.displayName || "", 
      phone: "", 
      email: user?.email || "", 
      address: "", 
      time: "", 
      paymentMethod: "", 
      notes: "" 
    },
  });

  // Set Default Payment Method based on cart content
  useEffect(() => {
    if (availableMethods?.length) {
      const defaultMethod = availableMethods.find(m => 
        hasServices ? m.isDefaultForServices : m.isDefaultForProducts
      ) || availableMethods[0];
      
      form.setValue('paymentMethod', defaultMethod.id);
    }
  }, [availableMethods, hasServices, form]);

  const selectedMethod = availableMethods?.find(m => m.id === form.watch('paymentMethod'));
  const finalTotal = subtotal * 1.08 - (couponData ? (couponData.discountType === 'percent' ? (subtotal * couponData.value / 100) : couponData.value) : 0);

  const handleApplyCoupon = async () => {
    const code = form.getValues('coupon');
    if (!code) return;
    setCouponError('');
    try {
      const q = query(collection(db!, 'coupons'), where('code', '==', code.toUpperCase()), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError('Invalid coupon.');
        setCouponData(null);
      } else {
        setCouponData(snap.docs[0].data());
      }
    } catch (e) {
      setCouponError('Error validating coupon.');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const collName = hasServices ? 'bookings' : 'orders';
      const docRef = await addDoc(collection(db!, collName), {
        customerId: user?.uid || 'guest',
        customerName: values.name,
        customerPhone: values.phone,
        items,
        totalPrice: finalTotal,
        paymentMethod: selectedMethod?.name || 'Unknown',
        paymentStatus: 'Pending',
        status: 'New',
        address: values.address,
        dateTime: values.date?.toISOString() || new Date().toISOString(),
        timeSlot: values.time,
        notes: values.notes,
        createdAt: new Date().toISOString()
      });
      clearCart();
      setCheckoutOpen(false);
      router.push(`/order-success?id=${docRef.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 border-none rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid lg:grid-cols-5 max-h-[90vh] overflow-y-auto">
          {/* Form Section */}
          <div className="lg:col-span-3 p-6 md:p-10 bg-white">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><CheckCircle2 size={24} /></div>
                {t('checkout_title')}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Secure Encrypted Transaction</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Your Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} className="h-12 bg-gray-50 border-gray-100" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Phone Number</FormLabel>
                    <FormControl><Input placeholder="01XXXXXXXXX" {...field} className="h-12 bg-gray-50 border-gray-100" /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery / Service Address</FormLabel>
                  <FormControl><Textarea placeholder="Full detailed address..." {...field} className="bg-gray-50 border-gray-100 min-h-[80px]" /></FormControl></FormItem>
                )} />

                {hasServices && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Preferred Date</FormLabel>
                        <Popover><PopoverTrigger asChild><Button variant="outline" className="h-12 bg-white justify-start gap-2 font-bold">{field.value ? format(field.value, "PPP") : <span>Pick Date</span>}<CalendarIcon size={14} /></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-xl"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} /></PopoverContent></Popover>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Time Slot</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-12 bg-white font-bold"><SelectValue placeholder="Select Slot" /></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl"><SelectItem value="morning">Morning (8am-12pm)</SelectItem><SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem><SelectItem value="evening">Evening (4pm-8pm)</SelectItem></SelectContent></Select></FormItem>
                    )} />
                  </div>
                )}

                <div className="space-y-4">
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Payment Method</FormLabel>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableMethods?.map(m => (
                        <div key={m.id} className={cn(
                          "flex items-center space-x-2 rounded-xl border p-3 hover:bg-gray-50 cursor-pointer transition-all",
                          field.value === m.id ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary" : "border-gray-100"
                        )}>
                          <RadioGroupItem value={m.id} id={m.id} className="sr-only" />
                          <label htmlFor={m.id} className="text-[11px] font-black uppercase flex items-center gap-2 w-full cursor-pointer">
                             {m.type === 'mobile' ? <Smartphone size={14} /> : m.type === 'card' ? <CreditCard size={14} /> : <Wallet size={14} />}
                             {m.name}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  )} />
                  
                  {selectedMethod?.instructions && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                       <p className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-2"><Info size={12} /> Instructions</p>
                       <p className="text-xs text-amber-900 leading-relaxed font-medium">{selectedMethod.instructions}</p>
                       {selectedMethod.accountNumber && <p className="text-sm font-black text-amber-900">Number: {selectedMethod.accountNumber}</p>}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-16 font-black text-lg rounded-2xl shadow-xl mt-6 uppercase tracking-tight" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm & Place Order"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-2 bg-[#F9FAFB] p-6 md:p-10 border-l border-gray-100">
            <h3 className="text-lg font-black uppercase mb-8 border-b border-gray-200 pb-4 tracking-tighter">Order Summary</h3>
            
            <div className="space-y-5 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-gray-900 truncate">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Qty: {item.quantity} × ৳{item.price}</p>
                  </div>
                  <span className="text-xs font-black text-primary">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-5 pt-8 border-t border-gray-200">
              <div className="flex gap-2">
                <Input placeholder="Coupon Code" {...form.register('coupon')} className="h-10 text-xs bg-white border-gray-200 uppercase font-bold" />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="h-10 px-4 font-black bg-white border-primary text-primary hover:bg-primary/5">APPLY</Button>
              </div>
              {couponError && <p className="text-[10px] text-destructive font-black uppercase tracking-tighter">{couponError}</p>}
              {couponData && <p className="text-[10px] text-green-600 font-black uppercase tracking-tighter">Coupon Active: {couponData.code}</p>}

              <div className="space-y-3 text-sm pt-4">
                <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-widest"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-widest"><span>Tax (8%)</span><span>৳{(subtotal * 0.08).toLocaleString()}</span></div>
                {couponData && <div className="flex justify-between text-green-600 text-[10px] font-black uppercase tracking-widest"><span>Discount</span><span>-৳{(couponData.discountType === 'percent' ? (subtotal * couponData.value / 100) : couponData.value).toLocaleString()}</span></div>}
                <div className="flex justify-between text-2xl font-black text-gray-900 border-t-2 border-primary/10 pt-6 mt-4"><span>Total</span><span>৳{finalTotal.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <div className="p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle2 size={18} /></div>
               <p className="text-[9px] font-black uppercase text-gray-500 leading-tight">Your payment is processed through secure industry-standard encryption.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
