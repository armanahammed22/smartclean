
'use client';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, Wallet, CreditCard, Smartphone, ShoppingCart, TicketPercent, CheckCircle2, Info, Zap, ShieldCheck, User, MapPin, Clock, Phone, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, setDoc, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required").optional().or(z.literal('')),
  address: z.string().min(10, "Address required"),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please select a time slot"),
  paymentMethod: z.string(),
  deliveryOption: z.string().min(1, "Required"),
  coupon: z.string().optional(),
  notes: z.string().optional(),
  otp: z.string().optional(),
});

export function CheckoutModal() {
  const { items, subtotal, clearCart, isCheckoutOpen, setCheckoutOpen } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [mounted, setMounted] = useState(false);

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

  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), where('isEnabled', '==', true), orderBy('amount', 'asc')) : null, [db]);
  const { data: deliveryOptions } = useCollection(deliveryQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: user?.displayName || "", 
      phone: "", 
      email: user?.email || "", 
      address: "", 
      date: undefined as any,
      time: "morning", 
      paymentMethod: "", 
      deliveryOption: "",
      notes: "",
      otp: ""
    },
  });

  useEffect(() => {
    if (isCheckoutOpen && mounted) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      form.setValue('date', tomorrow);
    }
  }, [isCheckoutOpen, mounted, form]);

  const selectedDeliveryId = form.watch('deliveryOption');
  const selectedDelivery = deliveryOptions?.find(d => d.id === selectedDeliveryId);
  const deliveryCharge = Number(selectedDelivery?.amount) || 0;

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

  const couponDiscount = couponData ? (couponData.discountType === 'percent' ? (subtotal * couponData.value / 100) : couponData.value) : 0;
  const finalTotal = Number(((subtotal * 1.08 + deliveryCharge) - couponDiscount).toFixed(2));

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
      toast({ title: t('otp_sent'), description: `Verification code: ${mockOtp}` });
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

  const handleApplyCoupon = async () => {
    const code = form.getValues('coupon');
    if (!code || !db) return;
    setCouponError('');
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError('Invalid coupon.');
        setCouponData(null);
      } else {
        setCouponData(snap.docs[0].data());
        toast({ title: "Coupon Applied" });
      }
    } catch (e) {
      setCouponError('Error validating coupon.');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db || !auth) return;
    if (isOtpSystemEnabled && !user && !isVerified) {
      toast({ variant: "destructive", title: "Phone Verification Required" });
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
            if (authError.code === 'auth/email-already-in-use') {
              console.log("Account already exists in Auth system.");
            } else {
              throw authError;
            }
          }
        }
      }

      const collName = hasServices ? 'bookings' : 'orders';
      let assignedTech = null;

      if (hasServices) {
        const serviceId = items.find(i => i.itemType === 'service')?.id;
        if (serviceId) {
          const techQuery = query(
            collection(db, 'employee_profiles'),
            where('skills', 'array-contains', serviceId),
            where('status', '==', 'Active')
          );
          
          const techSnap = await getDocs(techQuery);
          const candidates = techSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));

          for (const tech of candidates) {
            const availQuery = query(
              collection(db, 'staff_availability'), 
              where('uid', '==', tech.id), 
              where('status', '==', 'Available')
            );
            const availSnap = await getDocs(availQuery);
            if (!availSnap.empty) {
              assignedTech = { id: tech.id, name: tech.name };
              updateDoc(doc(db, 'staff_availability', tech.id as string), { 
                status: 'Busy', 
                updatedAt: serverTimestamp() 
              });
              break;
            }
          }
        }
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
        deliveryCharge: deliveryCharge,
        totalPrice: finalTotal,
        paymentMethod: availableMethods?.find(m => m.id === values.paymentMethod)?.name || 'Unknown',
        address: values.address,
        dateTime: values.date?.toISOString() || null,
        timeSlot: values.time,
        notes: values.notes,
        createdAt: new Date().toISOString(),
        status: assignedTech ? 'Assigned' : 'New',
        employeeId: assignedTech?.id || null,
        employeeName: assignedTech?.name || null,
        serviceId: items.find(i => i.itemType === 'service')?.id || null,
        serviceTitle: items.find(i => i.itemType === 'service')?.name || null
      });

      clearCart();
      setCheckoutOpen(false);
      const transactionType = hasServices ? 'booking' : 'order';
      router.push(`/order-success?id=${docRef.id}&type=${transactionType}${tempPass ? `&pw=${tempPass}&email=${values.email || values.phone}` : ''}`);
      
    } catch (e: any) {
      console.error("Checkout failed:", e);
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#F8FAFC]">
        <div className="grid lg:grid-cols-5 max-h-[90vh] overflow-y-auto">
          {/* Form Section (Left) */}
          <div className="lg:col-span-3 p-6 md:p-12 bg-white">
            <DialogHeader className="mb-10 text-left">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full mb-4">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Booking & Delivery</span>
              </div>
              <DialogTitle className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#081621]">
                {t('checkout_title')}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <User size={14} className="text-blue-600" /> {t('delivery_info')}
                  </h4>
                  
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('full_name')}</FormLabel>
                      <FormControl><Input placeholder="Your full name" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('phone_number')}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl><Input placeholder="01XXXXXXXXX" {...field} disabled={isVerified} className="h-14 bg-gray-50 border-gray-100 flex-1 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                          {isOtpSystemEnabled && !user && !isVerified && (
                            <Button type="button" variant="secondary" onClick={handleSendOtp} disabled={isVerifying} className="h-14 px-6 font-black uppercase text-[10px] rounded-2xl">
                              {isVerifying ? <Loader2 className="animate-spin" /> : t('send_otp')}
                            </Button>
                          )}
                          {isVerified && <div className="h-14 px-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-2"><CheckCircle2 size={18} /> <span className="text-[10px] font-black">VERIFIED</span></div>}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {isOtpSent && !isVerified && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <FormField control={form.control} name="otp" render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder="OTP Code" {...field} className="h-14 bg-white border-green-600/30 rounded-2xl text-center text-xl font-black tracking-widest" /></FormControl>
                          </FormItem>
                        )} />
                        <Button type="button" onClick={handleVerifyOtp} className="h-14 px-8 font-black uppercase text-[10px] rounded-2xl bg-green-600 text-white">VERIFY</Button>
                      </div>
                    )}
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('email_optional')}</FormLabel>
                      <FormControl><Input placeholder="example@mail.com" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('delivery_address')}</FormLabel>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 text-muted-foreground" size={20} />
                        <FormControl><Textarea placeholder="House, Street, Area" {...field} className="bg-gray-50 border-gray-100 min-h-[100px] rounded-2xl focus:bg-white transition-all pl-12 pt-4 text-base" /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Truck size={14} className="text-primary" /> Delivery / Zone Charges
                  </h4>
                  <FormField control={form.control} name="deliveryOption" render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {deliveryOptions?.map(opt => (
                        <div key={opt.id} className={cn(
                          "flex items-center space-x-2 rounded-2xl border-2 p-4 cursor-pointer transition-all bg-white", 
                          field.value === opt.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                        )}>
                          <RadioGroupItem value={opt.id} id={`modal-del-${opt.id}`} className="sr-only" />
                          <label htmlFor={`modal-del-${opt.id}`} className="flex flex-col cursor-pointer w-full">
                            <span className="text-[10px] font-black uppercase text-[#081621]">{opt.label}</span>
                            <span className="text-sm font-black text-primary">৳{opt.amount?.toLocaleString()}</span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  )} />
                </div>

                {hasServices && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Clock size={14} className="text-orange-500" /> Booking Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                      <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="h-14 bg-white justify-start gap-2 font-bold rounded-2xl border-orange-200">
                                {field.value ? format(field.value, "PPP") : <span>{t('pick_date')}</span>}
                                <CalendarIcon size={16} className="ml-auto text-orange-500" />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-14 bg-white font-bold rounded-2xl border-orange-200"><SelectValue placeholder={t('select_time')} /></SelectTrigger></FormControl>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="morning">{t('morning')}</SelectItem>
                              <SelectItem value="afternoon">{t('afternoon')}</SelectItem>
                              <SelectItem value="evening">{t('evening')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {/* Action Section (Right) */}
          <div className="lg:col-span-2 bg-[#F9FAFB] p-6 md:p-10 border-l border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-black uppercase tracking-tighter text-[#081621]">{t('order_summary')}</h3>
              <ShoppingCart size={20} className="text-green-600" />
            </div>
            
            <div className="space-y-4 mb-10">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-[#081621] truncate leading-tight">{item.name}</p>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-xs font-black text-green-600">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              
              <div className="pt-4 border-t border-dashed space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>{t('subtotal')}</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>{t('tax')} (8%)</span>
                  <span>৳{(subtotal * 0.08).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-primary">
                  <span>{selectedDelivery?.label || 'Delivery'}</span>
                  <span>৳{deliveryCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Due</span>
                    <span className="text-3xl font-black text-[#081621] tracking-tighter">৳{finalTotal.toLocaleString()}</span>
                  </div>
                  <Badge className="bg-[#081621] text-white border-none font-black text-[8px] px-2 rounded-full">VAT INC</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Wallet size={14} className="text-green-600" /> {t('payment_method')}</h4>
                <Form {...form}>
                  <form className="space-y-6">
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-3">
                        {availableMethods?.map(m => (
                          <div key={m.id} className={cn(
                            "flex items-center space-x-2 rounded-2xl border-2 p-4 cursor-pointer transition-all bg-white", 
                            field.value === m.id ? "border-green-600 shadow-sm" : "border-gray-100"
                          )}>
                            <RadioGroupItem value={m.id} id={`modal-pay-${m.id}`} className="sr-only" />
                            <label htmlFor={`modal-pay-${m.id}`} className="text-[10px] font-black uppercase flex items-center gap-3 w-full cursor-pointer text-[#081621]">
                               <div className={cn("p-2 rounded-xl", field.value === m.id ? "bg-green-600 text-white" : "bg-gray-50 text-gray-400")}>
                                  {m.type === 'mobile' ? <Smartphone size={14} /> : m.type === 'card' ? <CreditCard size={14} /> : <Wallet size={14} />}
                               </div>
                               {m.name}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    )} />
                  </form>
                </Form>
              </div>

              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                className="w-full h-16 font-black text-lg rounded-2xl shadow-xl uppercase tracking-tight bg-green-600 hover:bg-green-700 text-white gap-2 transition-transform active:scale-95" 
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                  <>{hasServices ? 'Confirm Booking' : 'Place Order'} <Zap size={18} fill="currentColor" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
