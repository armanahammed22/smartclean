
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Loader2, User, MapPin, CheckCircle2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useFirestore, useUser, useAuth, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/public-layout';
import { trackEvent } from '@/lib/tracking';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Please provide a complete address"),
  paymentMethod: z.string().min(1, "Required"),
  deliveryOption: z.string().optional(),
  notes: z.string().optional(),
});

function CheckoutContent() {
  const { items, subtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (items.length > 0) {
      // 📊 Track InitiateCheckout
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
      deliveryOption: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db) return;
    setIsSubmitting(true);
    
    const hasServices = items.some(i => i.itemType === 'service');
    const finalAmount = Number((subtotal * 1.08).toFixed(2));

    try {
      const collName = hasServices ? 'bookings' : 'orders';
      const orderData = {
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email || null,
        address: values.address,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        totalPrice: finalAmount,
        createdAt: new Date().toISOString(),
        status: 'New'
      };

      const docRef = await addDoc(collection(db, collName), orderData);

      // 💰 Track Purchase (Pixel + CAPI)
      // This is the most important conversion event
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
      router.push(`/order-success?id=${docRef.id}&type=${hasServices ? 'booking' : 'order'}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#081621]">Secure Checkout</h1>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-blue-600 text-white p-8">
                  <CardTitle className="text-xl font-black uppercase flex items-center gap-3"><User size={20}/> Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</FormLabel>
                        <FormControl><Input placeholder="Enter Name" {...field} className="h-12 rounded-xl bg-gray-50 border-none shadow-inner font-bold"/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</FormLabel>
                        <FormControl><Input placeholder="01XXXXXXXXX" {...field} className="h-12 rounded-xl bg-gray-50 border-none shadow-inner font-bold"/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email (Optional)</FormLabel>
                      <FormControl><Input type="email" placeholder="email@example.com" {...field} className="h-12 rounded-xl bg-gray-50 border-none shadow-inner"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Address</FormLabel>
                      <FormControl><Textarea placeholder="House, Road, Block, Area" {...field} className="min-h-[100px] rounded-xl bg-gray-50 border-none shadow-inner p-4 font-medium"/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Button type="submit" className="w-full h-16 font-black text-xl rounded-2xl shadow-xl bg-green-600 hover:bg-green-700 text-white uppercase tracking-tight gap-3 transition-transform active:scale-95" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Confirm Order</>}
              </Button>
            </div>

            <div className="lg:col-span-5 w-full lg:sticky lg:top-24">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-green-600">
                <CardHeader className="p-8 border-b border-gray-50">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-[#081621]">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-[11px] font-bold uppercase text-gray-600">
                        <span className="truncate max-w-[200px]">{item.name} × {item.quantity}</span>
                        <span className="text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-6 border-t-4 border-dashed flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-green-600 uppercase mb-1">Total Payable</span>
                        <span className="text-3xl font-black text-[#081621]">৳{(subtotal * 1.08).toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] px-3 py-1 rounded-md">VAT INC.</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
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
