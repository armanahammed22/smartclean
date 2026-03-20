
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { Loader2, Wallet, CreditCard, User, MapPin, ShieldCheck, ShoppingCart, Zap, Smartphone, CheckCircle2, Truck } from 'lucide-react';
import { useFirestore, useUser, useAuth, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid (Required)"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Please provide a complete address"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  deliveryOption: z.string().min(1, "Please select a delivery option"),
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

  // Fetch Payment Methods
  const methodsQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_methods'), where('isEnabled', '==', true)) : null, [db]);
  const { data: availableMethods, isLoading: mLoading } = useCollection(methodsQuery);

  // Fetch Delivery Options
  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), where('isEnabled', '==', true), orderBy('amount', 'asc')) : null, [db]);
  const { data: deliveryOptions, isLoading: dLoading } = useCollection(deliveryQuery);

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

  // Watch delivery selection for calculation
  const selectedDeliveryId = form.watch('deliveryOption');
  const selectedDelivery = deliveryOptions?.find(d => d.id === selectedDeliveryId);
  const deliveryCharge = selectedDelivery?.amount || 0;

  useEffect(() => {
    if (availableMethods?.length) {
      const defaultMethod = availableMethods.find(m => 
        hasServices ? m.isDefaultForServices : m.isDefaultForProducts
      ) || availableMethods[0];
      form.setValue('paymentMethod', defaultMethod.id);
    }
  }, [availableMethods, hasServices, form]);

  useEffect(() => {
    if (deliveryOptions?.length) {
      form.setValue('deliveryOption', deliveryOptions[0].id);
    }
  }, [deliveryOptions, form]);

  const assessRisk = async (phone: string) => {
    if (!db) return { level: 'Low', suspicious: false };
    const recentQ = query(
      collection(db, 'orders'), 
      where('customerPhone', '==', phone),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const snap = await getDocs(recentQ);
    if (snap.docs.length >= 2) return { level: 'High', suspicious: true };
    return { level: 'Low', suspicious: false };
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db) return;
    setIsSubmitting(true);
    
    let currentUserId = user?.uid;
    let tempPass = '';

    try {
      if (!user) {
        const phoneCheckQ = query(collection(db, 'users'), where('phone', '==', values.phone));
        const phoneSnap = await getDocs(phoneCheckQ);
        
        if (!phoneSnap.empty) {
          currentUserId = phoneSnap.docs[0].id;
        } else {
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

      const riskData = await assessRisk(values.phone);
      const collectionName = hasServices ? 'bookings' : 'orders';
      const orderData = {
        customerId: currentUserId || 'guest',
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email || null,
        address: values.address,
        items,
        subtotal: subtotal,
        tax: subtotal * 0.08,
        deliveryCharge: deliveryCharge,
        deliveryMethod: selectedDelivery?.label || 'Standard',
        totalPrice: (subtotal * 1.08) + deliveryCharge,
        paymentMethod: availableMethods?.find(m => m.id === values.paymentMethod)?.name || values.paymentMethod,
        status: 'New',
        riskLevel: riskData.level,
        isSuspicious: riskData.suspicious,
        ipAddress: 'Captured on Server',
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

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                  
                  {/* Left Column: Customer Details */}
                  <div className="lg:col-span-7 space-y-8">
                    <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                      <CardHeader className="bg-blue-600 text-white p-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <User size={24} />
                          </div>
                          <CardTitle className="text-xl font-black uppercase tracking-tight">{t('delivery_info')}</CardTitle>
                        </div>
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
                              <FormControl><Input placeholder="01XXXXXXXXX" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
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
                            <div className="relative">
                              <MapPin className="absolute left-4 top-4 text-muted-foreground" size={20} />
                              <FormControl>
                                <Textarea placeholder="House, Street, Area" className="min-h-[120px] pl-12 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base pt-4" {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        {/* Delivery Method Selection */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Truck size={14} /> {hasServices ? 'Service Region' : 'Delivery Method'}
                          </h4>
                          <FormField control={form.control} name="deliveryOption" render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {deliveryOptions?.map((opt) => (
                                <div key={opt.id} className={cn(
                                  "flex items-center space-x-2 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                                  field.value === opt.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200 bg-white"
                                )}>
                                  <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                                  <label htmlFor={opt.id} className="flex flex-col gap-1 cursor-pointer w-full">
                                    <span className="text-xs font-black uppercase tracking-tight text-[#081621]">{opt.label}</span>
                                    <span className="text-sm font-black text-primary">৳{opt.amount?.toLocaleString()}</span>
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          )} />
                        </div>

                        <FormField control={form.control} name="notes" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('order_notes')}</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any instructions for our team?" className="min-h-[80px] bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base pt-4" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Order Summary & Payment (Sticky) */}
                  <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                    <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-green-600">
                      <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-black uppercase tracking-widest text-[#081621]">{t('order_summary')}</CardTitle>
                          <ShoppingCart size={20} className="text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="space-y-6">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-start gap-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-black text-[#081621] uppercase leading-tight">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">×{item.quantity}</span>
                                  {item.itemType === 'service' && <span className="text-[9px] font-black text-blue-600 uppercase">Service</span>}
                                </div>
                              </div>
                              <span className="font-black text-sm text-[#081621]">৳{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t border-dashed pt-6 space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <span>{t('subtotal')}</span>
                              <span className="text-gray-900">৳{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <span>{t('tax')} (8%)</span>
                              <span className="text-gray-900">৳{(subtotal * 0.08).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                              <span>Delivery / Base Charge</span>
                              <span className="font-black">৳{deliveryCharge.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t-2 border-green-600/10">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">{t('total')}</span>
                                <span className="text-4xl font-black text-[#081621] tracking-tighter leading-none">৳{((subtotal * 1.08) + deliveryCharge).toLocaleString()}</span>
                              </div>
                              <div className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">BDT</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Section */}
                    <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                      <CardHeader className="bg-gray-900 text-white p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Wallet size={20} />
                          </div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">{t('payment_method')}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-3">
                                {mLoading ? (
                                  <div className="py-4 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
                                ) : availableMethods?.map((m) => (
                                  <div key={m.id} className={cn(
                                    "flex items-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                                    field.value === m.id ? "border-green-600 bg-green-50/50" : "border-gray-50 hover:border-gray-200 bg-white"
                                  )}>
                                    <RadioGroupItem value={m.id} id={m.id} className="sr-only" />
                                    <label htmlFor={m.id} className="font-bold flex items-center gap-4 cursor-pointer w-full text-sm">
                                      <div className={cn(
                                        "p-2 rounded-lg",
                                        field.value === m.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"
                                      )}>
                                        {m.type === 'mobile' ? <Smartphone size={16} /> : m.type === 'card' ? <CreditCard size={16} /> : <Wallet size={16} />}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="uppercase tracking-tight">{m.name}</span>
                                        {m.type === 'cod' && hasServices && <span className="text-[8px] text-red-500 font-black">UNAVAILABLE FOR SERVICES</span>}
                                      </div>
                                    </label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </CardContent>
                    </Card>

                    {/* Place Order Button */}
                    <Button type="submit" className="w-full h-20 font-black text-2xl rounded-[2rem] shadow-2xl bg-green-600 hover:bg-green-700 text-white uppercase tracking-tight gap-3 transition-transform active:scale-95" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-8 w-8 animate-spin" /> {t('processing')}</>
                      ) : (
                        <>{hasServices ? 'Book My Service' : t('place_order')} <Zap size={24} fill="currentColor" /></>
                      )}
                    </Button>
                  </div>

                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
