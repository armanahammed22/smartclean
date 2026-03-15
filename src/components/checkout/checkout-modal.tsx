
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, Wallet, CreditCard, ShieldCheck, Smartphone, Trash2, Minus, Plus, ShoppingCart, TicketPercent } from 'lucide-react';
import Image from 'next/image';
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
  const { items, subtotal, clearCart, isCheckoutOpen, setCheckoutOpen, updateQuantity, removeFromCart } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const router = useRouter();

  const hasServices = items.some(i => i.itemType === 'service');
  const finalTotal = subtotal * 1.08 - (couponData ? (couponData.discountType === 'percent' ? (subtotal * couponData.value / 100) : couponData.value) : 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: user?.displayName || "", phone: "", email: user?.email || "", address: "", time: "", paymentMethod: "cod", notes: "" },
  });

  const handleApplyCoupon = async () => {
    const code = form.getValues('coupon');
    if (!code) return;
    setCouponError('');
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError('Invalid or expired coupon.');
        setCouponData(null);
      } else {
        const data = snap.docs[0].data();
        setCouponData(data);
      }
    } catch (e) {
      setCouponError('Error validating coupon.');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const collName = hasServices ? 'bookings' : 'orders';
      const orderData = {
        customerId: user?.uid || 'guest',
        customerName: values.name,
        customerPhone: values.phone,
        items: items,
        totalPrice: finalTotal,
        paymentMethod: values.paymentMethod,
        paymentStatus: values.paymentMethod === 'cod' ? 'Pending' : 'Paid',
        status: 'New',
        address: values.address,
        dateTime: values.date?.toISOString() || new Date().toISOString(),
        timeSlot: values.time,
        notes: values.notes,
        couponCode: couponData?.code || null,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, collName), orderData);
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
      <DialogContent className="max-w-4xl w-[95vw] p-0 border-none rounded-2xl overflow-hidden">
        <div className="grid lg:grid-cols-5 max-h-[90vh] overflow-y-auto">
          <div className="lg:col-span-3 p-6 md:p-8 bg-white">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">{t('checkout_title')}</DialogTitle>
              <DialogDescription className="text-xs">Secure SSL encrypted checkout</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-wider">Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} className="h-11 bg-gray-50" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-wider">Phone</FormLabel>
                    <FormControl><Input placeholder="+880 1XXX-XXXXXX" {...field} className="h-11 bg-gray-50" /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-wider">Service Address</FormLabel>
                  <FormControl><Textarea placeholder="Full address..." {...field} className="bg-gray-50" /></FormControl></FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] font-black uppercase tracking-wider">Booking Date</FormLabel>
                      <Popover><PopoverTrigger asChild><Button variant="outline" className="h-11 bg-white justify-start gap-2">{field.value ? format(field.value, "PPP") : <span>Select Date</span>}<CalendarIcon size={14} /></Button></PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} /></PopoverContent></Popover>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-wider">Time Slot</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Select Slot" /></SelectTrigger>
                    <SelectContent><SelectItem value="morning">Morning (8am-12pm)</SelectItem><SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem><SelectItem value="evening">Evening (4pm-8pm)</SelectItem></SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <FormLabel className="text-[10px] font-black uppercase tracking-wider">Payment Gateway</FormLabel>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="cod" id="cod" /><label htmlFor="cod" className="text-[10px] font-bold">COD</label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="bkash" id="bkash" /><label htmlFor="bkash" className="text-[10px] font-bold">bKash</label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="stripe" id="stripe" /><label htmlFor="stripe" className="text-[10px] font-bold">Card</label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="paypal" id="paypal" /><label htmlFor="paypal" className="text-[10px] font-bold">PayPal</label>
                      </div>
                    </RadioGroup>
                  )} />
                </div>

                <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-4" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-2 bg-[#F9FAFB] p-6 md:p-8 border-l">
            <h3 className="text-lg font-black uppercase mb-6 border-b pb-4">Order Summary</h3>
            
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="min-w-0"><p className="text-xs font-bold truncate">{item.name}</p><p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p></div>
                  <span className="text-xs font-black">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex gap-2">
                <Input placeholder="Coupon Code" {...form.register('coupon')} className="h-9 text-xs bg-white" />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="h-9 font-bold"><TicketPercent size={14} /></Button>
              </div>
              {couponError && <p className="text-[10px] text-destructive font-bold">{couponError}</p>}
              {couponData && <p className="text-[10px] text-green-600 font-bold">Coupon applied: {couponData.code}</p>}

              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between text-muted-foreground text-xs"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground text-xs"><span>Tax (8%)</span><span>৳{(subtotal * 0.08).toLocaleString()}</span></div>
                {couponData && <div className="flex justify-between text-green-600 text-xs"><span>Discount</span><span>-৳{(couponData.discountType === 'percent' ? (subtotal * couponData.value / 100) : couponData.value).toLocaleString()}</span></div>}
                <div className="flex justify-between text-xl font-black text-primary border-t-2 border-primary/10 pt-4"><span>Total</span><span>৳{finalTotal.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
