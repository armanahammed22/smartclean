
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
import { Loader2, CalendarIcon, Wallet, CreditCard, Smartphone, ShoppingCart, TicketPercent, CheckCircle2, Info, Zap, ShieldCheck, User, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, setDoc, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required"),
  address: z.string().min(10, "Address required"),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please select a time slot"),
  paymentMethod: z.string(),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: user?.displayName || "", 
      phone: "", 
      email: user?.email || "", 
      address: "", 
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      time: "morning", 
      paymentMethod: "", 
      notes: "",
      otp: ""
    },
  });

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

  const handleSendOtp = () => {
    const phone = form.getValues('phone');
    if (!phone || phone.length < 10) {
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
    if (isOtpSystemEnabled && !user && !isVerified) {
      toast({ variant: "destructive", title: "Verification Required" });
      return;
    }

    setIsSubmitting(true);
    let currentUserId = user?.uid;
    let tempPass = '';

    try {
      if (!user && db) {
        tempPass = Math.random().toString(36).slice(-8);
        try {
          const userCred = await createUserWithEmailAndPassword(auth, values.email, tempPass);
          currentUserId = userCred.user.uid;
          await updateProfile(userCred.user, { displayName: values.name });
          await setDoc(doc(db, 'users', currentUserId), {
            uid: currentUserId,
            name: values.name,
            email: values.email.toLowerCase(),
            phone: values.phone,
            role: 'customer',
            status: 'active',
            createdAt: new Date().toISOString()
          });
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            toast({ variant: "destructive", title: "Account Exists", description: "Please sign in first." });
            setIsSubmitting(false);
            return;
          }
          throw authError;
        }
      }

      const collName = hasServices ? 'bookings' : 'orders';
      let assignedTech = null;

      // Smart Auto-Assignment for Services
      if (hasServices && db) {
        const serviceId = items.find(i => i.itemType === 'service')?.id;
        if (serviceId) {
          // 1. Find enrolled technicians with the skill, sorted by rating
          const techQuery = query(
            collection(db, 'employee_profiles'),
            where('skills', 'array-contains', serviceId),
            where('status', '==', 'Active'),
            orderBy('rating', 'desc'),
            limit(15)
          );
          
          const techSnap = await getDocs(techQuery);
          for (const techDoc of techSnap.docs) {
            // 2. Check real-time availability status
            const availQuery = query(
              collection(db, 'staff_availability'),
              where('uid', '==', techDoc.id),
              where('status', '==', 'Available')
            );
            const availSnap = await getDocs(availQuery);
            
            if (!availSnap.empty) {
              assignedTech = { id: techDoc.id, name: techDoc.data().name };
              // 3. Mark technician as Busy
              await updateDoc(doc(db, 'staff_availability', techDoc.id), {
                status: 'Busy',
                updatedAt: serverTimestamp()
              });
              break;
            }
          }
        }
      }

      if (db) {
        const docRef = await addDoc(collection(db, collName), {
          customerId: currentUserId,
          customerName: values.name,
          customerPhone: values.phone,
          customerEmail: values.email,
          items,
          totalPrice: finalTotal,
          paymentMethod: selectedMethod?.name || 'Unknown',
          address: values.address,
          dateTime: values.date?.toISOString(),
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
        router.push(`/order-success?id=${docRef.id}${tempPass ? `&pw=${tempPass}&email=${values.email}` : ''}`);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#F8FAFC]">
        <div className="grid lg:grid-cols-5 max-h-[90vh] overflow-y-auto">
          {/* Form Section */}
          <div className="lg:col-span-3 p-6 md:p-12 bg-white">
            <DialogHeader className="mb-10 text-left">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full mb-4">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Ready to {hasServices ? 'Book' : 'Checkout'}</span>
              </div>
              <DialogTitle className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#081621]">
                {t('checkout_title')}
              </DialogTitle>
              {!user && (
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <Info className="text-blue-600" size={20} />
                  <p className="text-[11px] font-bold text-blue-800 uppercase tracking-tight leading-tight">{t('guest_note')}</p>
                </div>
              )}
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Information Group */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <User size={14} className="text-blue-600" /> {t('delivery_info')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder={t('full_name')} {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder="Email Address" {...field} className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <FormControl><Input placeholder={t('phone_number')} {...field} disabled={isVerified} className="h-14 bg-gray-50 border-gray-100 flex-1 rounded-2xl focus:bg-white transition-all text-base" /></FormControl>
                          {isOtpSystemEnabled && !user && !isVerified && (
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={handleSendOtp} 
                              disabled={isVerifying}
                              className="h-14 px-6 font-black uppercase text-[10px] rounded-2xl shadow-sm"
                            >
                              {isVerifying ? <Loader2 className="animate-spin" /> : t('send_otp')}
                            </Button>
                          )}
                          {isVerified && <div className="h-14 px-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-2 animate-in zoom-in-95"><CheckCircle2 size={18} /> <span className="text-[10px] font-black">VERIFIED</span></div>}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {isOtpSent && !isVerified && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                        <FormField control={form.control} name="otp" render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder={t('enter_otp')} {...field} className="h-14 bg-white border-green-600/30 rounded-2xl text-center text-xl font-black tracking-[0.5em]" /></FormControl>
                          </FormItem>
                        )} />
                        <Button type="button" onClick={handleVerifyOtp} className="h-14 px-8 font-black uppercase text-[10px] rounded-2xl bg-green-600 text-white hover:bg-green-700">VERIFY</Button>
                      </div>
                    )}
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 text-muted-foreground" size={20} />
                        <FormControl><Textarea placeholder={t('delivery_address')} {...field} className="bg-gray-50 border-gray-100 min-h-[100px] rounded-2xl focus:bg-white transition-all pl-12 pt-4 text-base" /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Service Specific Scheduling */}
                {hasServices && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Clock size={14} className="text-orange-500" /> Booking Schedule
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                      <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="h-14 bg-white justify-start gap-2 font-bold rounded-2xl border-orange-200 text-orange-950">
                                {field.value ? format(field.value, "PPP") : <span>{t('pick_date')}</span>}
                                <CalendarIcon size={16} className="ml-auto text-orange-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                              <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                disabled={(d) => d < new Date()} 
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white font-bold rounded-2xl border-orange-200 text-orange-950">
                              <SelectValue placeholder={t('select_time')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="morning">{t('morning')}</SelectItem>
                            <SelectItem value="afternoon">{t('afternoon')}</SelectItem>
                            <SelectItem value="evening">{t('evening')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* Payment Selection */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Wallet size={14} className="text-green-600" /> {t('payment_method')}
                  </h4>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableMethods?.map(m => (
                        <div key={m.id} className={cn(
                          "flex items-center space-x-2 rounded-2xl border-2 p-4 hover:bg-gray-50 cursor-pointer transition-all",
                          field.value === m.id ? "border-green-600 bg-green-50 shadow-sm" : "border-gray-50"
                        )}>
                          <RadioGroupItem value={m.id} id={m.id} className="sr-only" />
                          <label htmlFor={m.id} className="text-xs font-black uppercase flex items-center gap-3 w-full cursor-pointer text-[#081621]">
                             <div className={cn("p-2 rounded-xl", field.value === m.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400")}>
                                {m.type === 'mobile' ? <Smartphone size={16} /> : m.type === 'card' ? <CreditCard size={16} /> : <Wallet size={16} />}
                             </div>
                             {m.name}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  )} />
                </div>

                <Button type="submit" className="w-full h-20 font-black text-2xl rounded-[2rem] shadow-2xl mt-4 uppercase tracking-tight bg-green-600 hover:bg-green-700 text-white gap-3 transition-transform active:scale-95" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : (
                    <>
                      {hasServices ? 'Book My Service' : t('place_order')}
                      <Zap size={24} fill="currentColor" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-2 bg-[#F9FAFB] p-6 md:p-12 border-l border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-black uppercase tracking-tighter text-[#081621]">{t('order_summary')}</h3>
              <ShoppingCart size={20} className="text-green-600" />
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar mb-8">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="min-w-0 flex flex-col gap-1">
                    <p className="text-sm font-black uppercase text-[#081621] truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Qty: {item.quantity}</span>
                      {item.itemType === 'service' && <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] h-4">SERVICE</Badge>}
                    </div>
                  </div>
                  <span className="text-sm font-black text-green-600 min-w-fit">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6 pt-8 border-t-2 border-gray-200">
              <div className="flex gap-2">
                <Input placeholder="Coupon" {...form.register('coupon')} className="h-12 bg-white border-gray-200 uppercase font-black text-xs rounded-xl" />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="h-12 px-6 font-black bg-white border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl">APPLY</Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>{t('subtotal')}</span>
                  <span className="text-gray-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>{t('tax')} (8%)</span>
                  <span className="text-gray-900">৳{(subtotal * 0.08).toLocaleString()}</span>
                </div>
                {couponData && (
                  <div className="flex justify-between text-green-600 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>Coupon Discount</span>
                    <span>-৳{couponData.discountType === 'percent' ? (subtotal * couponData.value / 100) : couponData.value}</span>
                  </div>
                )}
                
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em] mb-1 leading-none">{t('total')}</span>
                      <span className="text-4xl font-black text-[#081621] tracking-tighter leading-none">৳{finalTotal.toLocaleString()}</span>
                    </div>
                    <Badge className="bg-[#081621] text-white border-none font-black text-[9px] px-3 py-1 rounded-full shadow-lg">BDT</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
               <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-4 group">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#081621] leading-none mb-1">{t('secure_checkout')}</p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">SSL Encrypted</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
