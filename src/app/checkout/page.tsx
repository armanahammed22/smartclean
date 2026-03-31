
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { Loader2, Wallet, CreditCard, User, MapPin, ShieldCheck, ShoppingCart, Zap, Smartphone, CheckCircle2, Truck, ArrowRight } from 'lucide-react';
import { useFirestore, useUser, useAuth, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/public-layout';
import { trackEvent } from '@/lib/tracking';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid (Required)"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Please provide a complete address"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  deliveryOption: z.string().min(1, "Please select a delivery option"),
  notes: z.string().optional(),
});

function CheckoutContent() {
  const { items, subtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');

  useEffect(() => {
    setMounted(true);
    if (items.length > 0) {
      trackEvent('InitiateCheckout', { value: subtotal, currency: 'BDT' });
    }
  }, [items, subtotal]);

  const hasServices = items.some(i => i.itemType === 'service');

  const methodsQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_methods'), where('isEnabled', '==', true)) : null, [db]);
  const { data: availableMethods } = useCollection(methodsQuery);

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
      paymentMethod: "",
      deliveryOption: "",
      notes: "",
    },
  });

  const selectedDeliveryId = form.watch('deliveryOption');
  const selectedDelivery = deliveryOptions?.find(d => d.id === selectedDeliveryId);
  const deliveryCharge = !hasServices ? (Number(selectedDelivery?.amount) || 0) : 0;

  useEffect(() => {
    if (availableMethods?.length) {
      const def = availableMethods.find(m => hasServices ? m.isDefaultForServices : m.isDefaultForProducts) || availableMethods[0];
      form.setValue('paymentMethod', def.id);
    }
    if (deliveryOptions?.length) form.setValue('deliveryOption', deliveryOptions[0].id);
  }, [availableMethods, hasServices, deliveryOptions, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db || !auth) return;
    setIsSubmitting(true);
    try {
      const collName = hasServices ? 'bookings' : 'orders';
      const docRef = await addDoc(collection(db, collName), {
        customerName: values.name,
        customerPhone: values.phone,
        address: values.address,
        totalPrice: Number((subtotal * 1.08 + deliveryCharge).toFixed(2)),
        createdAt: new Date().toISOString(),
        status: 'New'
      });
      clearCart();
      router.push(`/order-success?id=${docRef.id}&type=${hasServices ? 'booking' : 'order'}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const totalPayable = (subtotal * 1.08 + deliveryCharge).toLocaleString();

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 md:py-12 pb-32">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 md:mb-12 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#081621]">
              {hasServices ? 'Booking Details' : 'Checkout'}
            </h1>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 w-full space-y-6">
                  <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-blue-600 text-white p-6 md:p-8">
                      <CardTitle className="text-lg font-black uppercase flex items-center gap-3"><User size={20}/> Customer Info</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-black uppercase">Name</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-gray-50 border-none"/></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-black uppercase">Phone</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-gray-50 border-none"/></FormControl></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-black uppercase">Full Address</FormLabel><FormControl><Textarea {...field} className="min-h-[100px] rounded-xl bg-gray-50 border-none"/></FormControl></FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  <Button type="submit" className="w-full hidden md:flex h-16 font-black text-xl rounded-2xl shadow-xl bg-green-600 hover:bg-green-700 text-white uppercase" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Checkout'}
                  </Button>
                </div>

                <div className="lg:col-span-5 w-full lg:sticky lg:top-24">
                  <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-green-600">
                    <CardHeader className="p-6 md:p-8 border-b border-gray-50">
                      <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <div className="space-y-6">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm font-bold uppercase">
                            <span>{item.name} × {item.quantity}</span>
                            <span>৳{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="pt-6 border-t-2 border-dashed flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-green-600 uppercase mb-1">Total Due</span>
                            <span className="text-3xl font-black text-[#081621]">৳{totalPayable}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px]">VAT INC</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Mobile Sticky Action */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Payable</span>
                  <span className="text-xl font-black text-[#081621]">৳{totalPayable}</span>
                </div>
                <Button onClick={form.handleSubmit(onSubmit)} className="flex-1 h-14 rounded-xl bg-green-600 text-white font-black text-xs uppercase shadow-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Order Now'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PublicLayout minimalMobile={true}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>}>
        <CheckoutContent />
      </Suspense>
    </PublicLayout>
  );
}
