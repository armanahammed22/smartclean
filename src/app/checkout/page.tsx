
"use client";

import React, { useState, useEffect } from 'react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, CalendarIcon, Wallet, CreditCard, User, MapPin, Clock, Info, ShieldCheck, ShoppingCart, Zap, Phone } from 'lucide-react';
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid (Required)"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Please provide a complete address"),
  date: z.date().optional(),
  time: z.string().optional(),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  notes: z.string().optional(),
});

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const hasServices = items.some(i => i.itemType === 'service');
  const defaultPayment = hasServices ? "cash_in_hand" : "cod";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
      phone: "",
      email: user?.email || "",
      address: "",
      time: "morning",
      paymentMethod: defaultPayment,
      notes: "",
    },
  });

  useEffect(() => {
    form.setValue('paymentMethod', hasServices ? "cash_in_hand" : "cod");
  }, [hasServices, form]);

  // Risk Detection Engine
  const assessRisk = async (phone: string) => {
    if (!db) return { level: 'Low', suspicious: false };
    
    // Check for recent orders from this phone
    const recentQ = query(
      collection(db, 'orders'), 
      where('customerPhone', '==', phone),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const snap = await getDocs(recentQ);
    
    if (snap.docs.length >= 2) {
      return { level: 'High', suspicious: true }; // Multiple orders in short time
    }
    
    return { level: 'Low', suspicious: false };
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db) return;
    setIsSubmitting(true);
    
    let currentUserId = user?.uid;
    let tempPass = '';

    try {
      // 1. Phone based primary account logic
      if (!user) {
        const phoneCheckQ = query(collection(db, 'users'), where('phone', '==', values.phone));
        const phoneSnap = await getDocs(phoneCheckQ);
        
        if (!phoneSnap.empty) {
          currentUserId = phoneSnap.docs[0].id;
        } else {
          // Auto create account
          tempPass = Math.random().toString(36).slice(-8);
          const emailToCreate = values.email || `${values.phone}@smartclean.local`;
          const userCred = await createUserWithEmailAndPassword(auth, emailToCreate, tempPass);
          currentUserId = userCred.user.uid;
          await updateProfile(userCred.user, { displayName: values.name });
          await setDoc(doc(db, 'users', currentUserId), {
            uid: currentUserId,
            name: values.name,
            email: values.email?.toLowerCase() || null,
            phone: values.phone,
            role: 'customer',
            status: 'active',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 2. Risk Detection
      const riskData = await assessRisk(values.phone);

      const collectionName = hasServices ? 'bookings' : 'orders';
      const orderData = {
        customerId: currentUserId || 'guest',
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email || null,
        address: values.address,
        items,
        totalPrice: subtotal * 1.08,
        paymentMethod: values.paymentMethod,
        status: 'New',
        riskLevel: riskData.level,
        isSuspicious: riskData.suspicious,
        ipAddress: 'Captured on Server', // Mocked for client-side only
        deviceInfo: navigator.userAgent,
        createdAt: new Date().toISOString(),
        serviceTitle: items.find(i => i.itemType === 'service')?.name || null
      };

      const docRef = await addDoc(collection(db, collectionName), orderData);
      clearCart();
      router.push(`/order-success?id=${docRef.id}${tempPass ? `&pw=${tempPass}&email=${values.email || values.phone}` : ''}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('empty_cart')}</h2>
          <Button onClick={() => router.push('/')} className="rounded-full px-8">{t('browse_catalog')}</Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-[#F8FAFC] min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <header className="mb-12 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full mb-4">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('secure_checkout')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black font-headline text-[#081621] uppercase tracking-tight">
                {t('checkout_title')}
              </h1>
            </header>

            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-8 space-y-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                      <CardHeader className="bg-blue-600 text-white p-8">
                        <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><User size={24} /></div><CardTitle className="text-xl font-black uppercase tracking-tight">{t('delivery_info')}</CardTitle></div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('full_name')}</FormLabel>
                              <FormControl><Input placeholder="Full Name" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('phone_number')}</FormLabel>
                              <FormControl><Input placeholder="01XXXXXXXXX (Required)" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('email_optional')}</FormLabel>
                            <FormControl><Input placeholder="Email (optional)" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('delivery_address')}</FormLabel>
                            <div className="relative"><MapPin className="absolute left-4 top-4 text-muted-foreground" size={20} /><FormControl><Textarea placeholder="House, Street, Area" className="min-h-[120px] pl-12 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base pt-4" {...field} /></FormControl></div>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                      <CardHeader className="bg-gray-900 text-white p-8">
                        <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Wallet size={24} /></div><CardTitle className="text-xl font-black uppercase tracking-tight">{t('payment_method')}</CardTitle></div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                          <FormItem className="space-y-3"><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem className={cn("flex items-center space-x-3 space-y-0 rounded-2xl border-2 p-5 cursor-pointer transition-all", field.value === 'cod' ? "border-green-600 bg-green-50/50" : "border-gray-50 hover:border-gray-200 bg-white")}>
                              <FormControl><RadioGroupItem value="cod" disabled={hasServices} className="sr-only" /></FormControl>
                              <FormLabel className="font-bold flex items-center gap-4 cursor-pointer w-full text-base"><div className={cn("p-3 rounded-xl", field.value === 'cod' ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400")}><Wallet size={20} /></div><div className="flex flex-col"><span className="uppercase tracking-tight">{t('payment_cod')}</span>{hasServices && <span className="text-[10px] text-red-500 font-black">UNAVAILABLE FOR SERVICES</span>}</div></FormLabel>
                            </FormItem>
                            <FormItem className={cn("flex items-center space-x-3 space-y-0 rounded-2xl border-2 p-5 cursor-pointer transition-all", field.value === 'cash_in_hand' ? "border-green-600 bg-green-50/50" : "border-gray-50 hover:border-gray-200 bg-white")}>
                              <FormControl><RadioGroupItem value="cash_in_hand" className="sr-only" /></FormControl>
                              <FormLabel className="font-bold flex items-center gap-4 cursor-pointer w-full text-base"><div className={cn("p-3 rounded-xl", field.value === 'cash_in_hand' ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400")}><CreditCard size={20} /></div><div className="flex flex-col"><span className="uppercase tracking-tight">{t('payment_cash_hand')}</span><span className="text-[10px] text-green-600 font-black">MOST POPULAR</span></div></FormLabel>
                            </FormItem>
                          </RadioGroup></FormControl><FormMessage /></FormItem>
                        )} />
                      </CardContent>
                    </Card>

                    <Button type="submit" className="w-full h-20 font-black text-2xl rounded-[2rem] shadow-2xl bg-green-600 hover:bg-green-700 text-white uppercase tracking-tight gap-3 transition-transform active:scale-95" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-8 w-8 animate-spin" /> {t('processing')}</> : <>{hasServices ? 'Book My Service' : t('place_order')} <Zap size={24} fill="currentColor" /></>}
                    </Button>
                  </form>
                </Form>
              </div>

              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-green-600">
                  <CardHeader className="p-8 border-b border-gray-50"><div className="flex items-center justify-between"><CardTitle className="text-xl font-black uppercase tracking-widest text-[#081621]">{t('order_summary')}</CardTitle><ShoppingCart size={20} className="text-green-600" /></div></CardHeader>
                  <CardContent className="p-8"><div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-4"><div className="flex flex-col gap-1"><span className="text-xs font-black text-[#081621] uppercase leading-tight">{item.name}</span><div className="flex items-center gap-2"><span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">×{item.quantity}</span>{item.itemType === 'service' && <span className="text-[9px] font-black text-blue-600 uppercase">Service</span>}</div></div><span className="font-black text-sm text-[#081621]">৳{(item.price * item.quantity).toLocaleString()}</span></div>
                    ))}
                    <div className="border-t border-dashed pt-6 space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>{t('subtotal')}</span><span className="text-gray-900">৳{subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>{t('tax')} (8%)</span><span className="text-gray-900">৳{(subtotal * 0.08).toLocaleString()}</span></div>
                      <div className="flex justify-between items-end pt-4 border-t-2 border-green-600/10"><div className="flex flex-col"><span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">{t('total')}</span><span className="text-4xl font-black text-[#081621] tracking-tighter leading-none">৳{(subtotal * 1.08).toLocaleString()}</span></div><div className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">BDT</div></div>
                    </div>
                  </div></CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
