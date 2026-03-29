
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, Wallet, CreditCard, Smartphone, ShoppingCart, CheckCircle2, Zap, ShieldCheck, User, MapPin, Clock, Phone, Truck, ChevronDown, ArrowRight, TicketPercent, X, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc(settingsRef);
  const isOtpSystemEnabled = !!globalSettings?.otpEnabled;

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
      date: undefined,
      time: "8AM - 12PM", 
      paymentCategory: 'cod',
      onlineMethod: "",
      notes: "",
      otp: ""
    },
  });

  useEffect(() => {
    if (isCheckoutOpen && user) {
      form.setValue('name', user.displayName || "");
      form.setValue('email', user.email || "");
    }
  }, [isCheckoutOpen, user, form]);

  const onlineMethods = useMemo(() => availableMethods?.filter(m => m.type !== 'cod') || [], [availableMethods]);
  
  const selectedDeliveryId = form.watch('deliveryOption' as any);
  const selectedDelivery = deliveryOptions?.find(d => d.id === selectedDeliveryId);
  const deliveryCharge = !hasServices ? (Number(selectedDelivery?.amount) || 0) : 0;

  const productSavings = useMemo(() => {
    return items.reduce((acc, item) => {
      if (item.regularPrice && item.regularPrice > item.price) {
        return acc + (item.regularPrice - item.price) * item.quantity;
      }
      return acc;
    }, 0);
  }, [items]);

  const smartSavings = subtotal - smartSubtotal;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percent') {
      return (smartSubtotal * appliedCoupon.value) / 100;
    }
    return appliedCoupon.value;
  }, [appliedCoupon, smartSubtotal]);

  const tax = Number((smartSubtotal * 0.08).toFixed(2));
  const finalTotal = Number((smartSubtotal + tax + deliveryCharge - couponDiscount).toFixed(2));

  const handleApplyCoupon = async () => {
    if (!db || !couponInput.trim()) return;
    setIsVerifyingCoupon(true);
    
    try {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', couponInput.trim().toUpperCase()),
        where('status', '==', 'Active')
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon", description: "This code does not exist or is inactive." });
        setAppliedCoupon(null);
      } else {
        const couponData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        if (couponData.expiryDate && new Date(couponData.expiryDate) < new Date()) {
          toast({ variant: "destructive", title: "Expired Coupon", description: "This coupon code has expired." });
          return;
        }
        setAppliedCoupon(couponData);
        toast({ title: "Coupon Applied!", description: `Discount added.` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to verify coupon." });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handleSendOtp = () => {
    const phoneVal = form.getValues('phone');
    if (!phoneVal || phoneVal.length < 10) {
      toast({ variant: "destructive", title: "Invalid Phone" });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setIsOtpSent(true);
      setIsVerifying(false);
      toast({ title: t('otp_sent'), description: `Code: ${mockOtp}` });
    }, 1200);
  };

  const handleVerifyOtp = () => {
    const input = form.getValues('otp');
    if (input === generatedOtp) {
      setIsVerified(true);
      toast({ title: t('otp_verified') });
    } else {
      toast({ variant: "destructive", title: t('invalid_otp') });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db || !auth) return;
    if (isOtpSystemEnabled && !user && !isVerified) {
      toast({ variant: "destructive", title: "Phone Verification Required" });
      return;
    }

    if (values.paymentCategory === 'online' && !values.onlineMethod) {
      toast({ variant: "destructive", title: "Payment Method Required", description: "Please select an online payment provider." });
      return;
    }

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
          const emailToCreate = values.email || `${values.phone}@smartclean.local`;
          tempPass = Math.random().toString(36).slice(-8);
          try {
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
              createdAt: new Date().toISOString(),
              totalEarnings: 0
            });
          } catch (authError: any) {
            if (authError.code !== 'auth/email-already-in-use') throw authError;
          }
        }
      }

      const collName = hasServices ? 'bookings' : 'orders';
      let finalPaymentName = "Cash on Delivery";
      if (values.paymentCategory === 'online') {
        const method = onlineMethods.find(m => m.id === values.onlineMethod);
        finalPaymentName = method?.name || "Online Payment";
      }

      const docRef = await addDoc(collection(db, collName), {
        customerId: currentUserId || 'guest',
        customerName: values.name,
        customerPhone: values.phone,
        customerEmail: values.email || null,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          itemType: item.itemType
        })),
        subtotal: subtotal,
        tax: tax,
        deliveryCharge: deliveryCharge,
        couponDiscount: couponDiscount,
        smartDiscount: smartSavings,
        couponCode: appliedCoupon?.code || null,
        totalPrice: finalTotal,
        paymentMethod: finalPaymentName,
        address: values.address,
        dateTime: values.date?.toISOString() || null,
        timeSlot: values.time || null,
        notes: values.notes,
        createdAt: new Date().toISOString(),
        status: 'New'
      });

      clearCart();
      setCheckoutOpen(false);
      const transactionType = hasServices ? 'booking' : 'order';
      router.push(`/order-success?id=${docRef.id}&type=${transactionType}${tempPass ? `&pw=${tempPass}&email=${values.email || values.phone}` : ''}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 border-none rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#F8FAFC]">
        <div className="flex flex-col h-[90vh] lg:h-auto lg:max-h-[90vh] relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:grid lg:grid-cols-5">
            {/* COLUMN 1: Customer Form */}
            <div className="lg:col-span-3 p-6 md:p-10 lg:p-12 bg-white">
              <DialogHeader className="mb-8 text-left hidden lg:block">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full mb-4">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{hasServices ? 'Secure Booking' : 'Secure Order'}</span>
                </div>
                <DialogTitle className="text-3xl font-black uppercase tracking-tight text-[#081621]">
                  {hasServices ? 'Booking Details' : 'Order Details'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><User size={14} className="text-primary" /> Customer Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" {...field} className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</FormLabel>
                          <div className="flex gap-2">
                            <FormControl><Input placeholder="01XXXXXXXXX" {...field} disabled={isVerified} className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all" /></FormControl>
                            {isOtpSystemEnabled && !user && !isVerified && (
                              <Button type="button" variant="secondary" onClick={handleSendOtp} disabled={isVerifying} className="h-12 px-4 font-black uppercase text-[10px] rounded-xl">
                                {isVerifying ? <Loader2 className="animate-spin" /> : t('send_otp')}
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {isOtpSent && !isVerified && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <FormField control={form.control} name="otp" render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder="OTP Code" {...field} className="h-12 bg-white border-primary rounded-xl text-center font-black tracking-widest" /></FormControl>
                          </FormItem>
                        )} />
                        <Button type="button" onClick={handleVerifyOtp} className="h-12 px-6 font-black uppercase text-[10px] rounded-xl bg-primary text-white">VERIFY</Button>
                      </div>
                    )}
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Address</FormLabel>
                        <FormControl><Textarea placeholder="House, Road, Area" {...field} className="bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all min-h-[80px]" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {hasServices && (
                    <div className="space-y-6 pt-6 border-t">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Clock size={14} className="text-primary" /> Booking Schedule</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("h-12 bg-gray-50 justify-start gap-2 font-bold rounded-xl border-gray-100", !field.value && "text-muted-foreground")}>
                                  <CalendarIcon size={16} className="text-primary" />
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="time" render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-12 bg-gray-50 font-bold rounded-xl border-gray-100"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="8AM - 12PM">8AM - 12PM (Morning)</SelectItem>
                                <SelectItem value="12PM - 4PM">12PM - 4PM (Afternoon)</SelectItem>
                                <SelectItem value="4PM - 8PM">4PM - 8PM (Evening)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-6 pt-6 border-t">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Wallet size={14} className="text-primary" /> Payment Method</h4>
                    <FormField control={form.control} name="paymentCategory" render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-3">
                            <div 
                              onClick={() => field.onChange('cod')}
                              className={cn(
                                "flex items-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                                field.value === 'cod' ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200 bg-white"
                              )}
                            >
                              <RadioGroupItem value="cod" id="cat-cod" className="sr-only" />
                              <label htmlFor="cat-cod" className="font-bold flex items-center gap-4 cursor-pointer w-full text-sm text-[#081621]">
                                <div className={cn("p-2 rounded-lg", field.value === 'cod' ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
                                  <Truck size={16} />
                                </div>
                                <div className="flex-1">
                                  <span className="uppercase tracking-tight block">Cash on Delivery</span>
                                  <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">DEFAULT</Badge>
                                </div>
                              </label>
                            </div>
                            <div 
                              onClick={() => field.onChange('online')}
                              className={cn(
                                "flex flex-col rounded-xl border-2 transition-all cursor-pointer",
                                field.value === 'online' ? "border-blue-600 bg-blue-50/30" : "border-gray-100 hover:border-gray-200 bg-white"
                              )}
                            >
                              <div className="flex items-center gap-4 p-4">
                                <RadioGroupItem value="online" id="cat-online" className="sr-only" />
                                <label htmlFor="cat-online" className="font-bold flex items-center gap-4 cursor-pointer w-full text-sm text-[#081621]">
                                  <div className={cn("p-2 rounded-lg", field.value === 'online' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400")}>
                                    <Smartphone size={16} />
                                  </div>
                                  <span className="uppercase tracking-tight">Online Payment</span>
                                </label>
                              </div>
                              {field.value === 'online' && (
                                <div className="p-4 pt-0 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                  <FormField control={form.control} name="onlineMethod" render={({ field: subField }) => (
                                    <FormItem>
                                      <Select onValueChange={subField.onChange} value={subField.value}>
                                        <FormControl><SelectTrigger className="h-12 bg-white border-blue-200 font-bold rounded-xl"><SelectValue placeholder="Choose Provider" /></SelectTrigger></FormControl>
                                        <SelectContent className="rounded-xl">
                                          {onlineMethods.map(m => <SelectItem key={m.id} value={m.id} className="font-bold uppercase text-[10px]">{m.name}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                </div>
                              )}
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </form>
              </Form>
            </div>

            {/* COLUMN 2: Summary */}
            <div className="lg:col-span-2 bg-[#F9FAFB] p-6 md:p-10 border-b lg:border-b-0 lg:border-l border-gray-100 flex flex-col order-last">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-black uppercase tracking-tighter text-[#081621] flex items-center gap-2">
                  <ShoppingCart size={20} className="text-primary" /> {hasServices ? 'Booking Summary' : t('order_summary')}
                </h3>
                <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black">{items.length} {items.length > 1 ? 'Items' : 'Item'}</Badge>
              </div>
              <div className="space-y-3 mb-8">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-4 bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase text-[#081621] truncate leading-tight">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase bg-gray-50 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                        <span className="text-[9px] font-bold text-primary uppercase">৳{item.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-900 shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="mb-8 p-4 bg-white rounded-2xl border border-dashed border-primary/30 space-y-3">
                <div className="flex items-center gap-2 text-[#081621]">
                  <TicketPercent size={16} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Apply Promo Code</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/20">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase">{appliedCoupon.code}</span>
                      <span className="text-[8px] font-bold text-gray-500">PROMO APPLIED</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="ENTER CODE" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-black placeholder:font-normal" />
                    <Button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponInput} className="h-10 px-4 rounded-xl font-black text-[10px] uppercase shadow-sm">
                      {isVerifyingCoupon ? <Loader2 className="animate-spin" size={14} /> : 'APPLY'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-6 border-t-2 border-dashed border-gray-200">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                {smartSavings > 0 && (
                  <div className="flex justify-between text-[10px] font-black uppercase text-blue-600 animate-in zoom-in-95">
                    <span className="flex items-center gap-1"><TrendingDown size={12}/> Smart Pricing</span>
                    <span>-৳{smartSavings.toLocaleString()}</span>
                  </div>
                )}
                {productSavings > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-green-600"><span>Product Savings</span><span>-৳{productSavings.toLocaleString()}</span></div>}
                {appliedCoupon && <div className="flex justify-between text-[10px] font-black uppercase text-primary animate-in zoom-in-95"><span>Coupon Discount ({appliedCoupon.code})</span><span>-৳{couponDiscount.toLocaleString()}</span></div>}
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Tax (8%)</span><span>৳{tax.toLocaleString()}</span></div>
                {!hasServices && <div className="flex justify-between text-[10px] font-black uppercase text-blue-600"><span>Delivery Charge</span><span>৳{deliveryCharge.toLocaleString()}</span></div>}
                <div className="pt-4 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Total Due</span>
                    <span className="text-3xl font-black text-[#081621] tracking-tighter leading-none">৳{finalTotal.toLocaleString()}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-none font-black text-[8px] px-2 rounded-full uppercase">VAT INC</Badge>
                </div>
              </div>
              <div className="hidden lg:block mt-8">
                <Button onClick={form.handleSubmit(onSubmit)} className="w-full h-16 rounded-2xl shadow-xl uppercase tracking-tight bg-primary hover:bg-primary/90 text-white font-black text-xl gap-3 transition-transform active:scale-95" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <>{hasServices ? 'Place Booking' : 'Place Order'} <Zap size={24} fill="currentColor" /></>}
                </Button>
              </div>
            </div>
          </div>
          {/* MOBILE ACTION BAR */}
          <div className="lg:hidden p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4 z-20">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Due</span>
              <span className="text-2xl font-black text-[#081621] tracking-tighter leading-none">৳{finalTotal.toLocaleString()}</span>
            </div>
            <Button onClick={form.handleSubmit(onSubmit)} className="flex-1 h-14 rounded-xl shadow-xl uppercase tracking-tighter bg-primary hover:bg-primary/90 text-white font-black text-sm gap-2" disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <>{hasServices ? 'Place Booking' : 'Place Order'} <ArrowRight size={18} /></>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
