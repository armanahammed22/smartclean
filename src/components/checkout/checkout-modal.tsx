
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, Wallet, CreditCard, Smartphone, ShoppingCart, TicketPercent, CheckCircle2, Info, Zap, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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

  // Global Settings for OTP Config
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc(settingsRef);
  const isOtpSystemEnabled = !!globalSettings?.otpEnabled;

  // OTP States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const hasServices = items.some(i => i.itemType === 'service');
  const mainServiceItem = items.find(i => i.itemType === 'service');
  
  const methodsQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_methods'), where('isEnabled', '==', true)) : null, [db]);
  const { data: availableMethods } = useCollection(methodsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: user?.displayName || "", 
      phone: "", 
      email: user?.email || "", 
      address: "", 
      date: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to tomorrow
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
      toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid phone number first." });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setIsOtpSent(true);
      setIsVerifying(false);
      console.log("SMS OTP (MOCK):", mockOtp);
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
        toast({ title: "Coupon Applied", description: `You saved ৳${couponData?.value}` });
      }
    } catch (e) {
      setCouponError('Error validating coupon.');
    }
  };

  const findBestTechnician = async (serviceId: string) => {
    if (!db) return null;
    const staffQuery = query(collection(db, 'employee_profiles'), where('skills', 'array-contains', serviceId), where('status', '==', 'Active'));
    const staffSnap = await getDocs(staffQuery);
    const qualifiedIds = staffSnap.docs.map(doc => doc.id);
    if (qualifiedIds.length === 0) return null;
    
    const availQuery = query(collection(db, 'staff_availability'), where('uid', 'in', qualifiedIds), where('isOnline', '==', true), where('status', '==', 'Available'));
    const availSnap = await getDocs(availQuery);
    const availableIds = availSnap.docs.map(doc => doc.id);
    if (availableIds.length === 0) return null;
    
    const bestRated = staffSnap.docs
      .filter(doc => availableIds.includes(doc.id))
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))[0];
    
    return bestRated;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Enforcement check if OTP is enabled globally
    if (isOtpSystemEnabled && !user && !isVerified) {
      toast({ variant: "destructive", title: "Verification Required", description: "Please verify your phone number to continue." });
      return;
    }

    setIsSubmitting(true);
    let currentUserId = user?.uid;
    let tempPass = '';

    try {
      // 1. Handle Guest Auto-Account Creation
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

      // 2. Booking / Order Logic
      const collName = hasServices ? 'bookings' : 'orders';
      let assignmentData: any = { status: 'New' };

      if (hasServices && mainServiceItem && db) {
        const bestStaff: any = await findBestTechnician(mainServiceItem.id);
        if (bestStaff) {
          assignmentData = {
            status: 'Assigned',
            employeeId: bestStaff.id,
            employeeName: bestStaff.name,
            assignedAt: new Date().toISOString()
          };
          await updateDoc(doc(db, 'staff_availability', bestStaff.id), { status: 'Busy', updatedAt: serverTimestamp() });
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
          serviceId: mainServiceItem?.id || null,
          ...assignmentData
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
      <DialogContent className="max-w-4xl w-[95vw] p-0 border-none rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid lg:grid-cols-5 max-h-[90vh] overflow-y-auto">
          {/* Form Section */}
          <div className="lg:col-span-3 p-6 md:p-10 bg-white">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><CheckCircle2 size={24} /></div>
                {t('checkout_title')}
              </DialogTitle>
              {!user && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                  <Info className="text-amber-600" size={18} />
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight leading-tight">{t('guest_note')}</p>
                </div>
              )}
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('full_name')}</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} className="h-12 bg-gray-50 border-gray-100 rounded-xl" /></FormControl>
                    <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</FormLabel>
                    <FormControl><Input placeholder="name@example.com" {...field} className="h-12 bg-gray-50 border-gray-100 rounded-xl" /></FormControl>
                    <FormMessage /></FormItem>
                  )} />
                </div>

                <div className="space-y-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('phone_number')}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl><Input placeholder="01XXXXXXXXX" {...field} disabled={isVerified} className="h-12 bg-gray-50 border-gray-100 flex-1 rounded-xl" /></FormControl>
                        {isOtpSystemEnabled && !user && !isVerified && (
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleSendOtp} 
                            disabled={isVerifying}
                            className="h-12 px-6 font-black uppercase text-[10px] rounded-xl"
                          >
                            {isVerifying ? <Loader2 className="animate-spin" /> : t('send_otp')}
                          </Button>
                        )}
                        {isVerified && <div className="h-12 px-4 bg-green-50 text-green-600 rounded-xl border border-green-100 flex items-center gap-2"><CheckCircle2 size={16} /> <span className="text-[10px] font-black">VERIFIED</span></div>}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {isOtpSent && !isVerified && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2">
                      <FormField control={form.control} name="otp" render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input placeholder={t('enter_otp')} {...field} className="h-12 bg-white border-primary/30 rounded-xl" /></FormControl>
                        </FormItem>
                      )} />
                      <Button type="button" onClick={handleVerifyOtp} className="h-12 px-8 font-black uppercase text-[10px] rounded-xl">VERIFY</Button>
                    </div>
                  )}
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('delivery_address')}</FormLabel>
                  <FormControl><Textarea placeholder="Full detailed address..." {...field} className="bg-gray-50 border-gray-100 min-h-[80px] rounded-xl" /></FormControl>
                  <FormMessage /></FormItem>
                )} />

                {hasServices && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">{t('booking_date')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-12 bg-white justify-start gap-2 font-bold rounded-xl border-gray-200">
                              {field.value ? format(field.value, "PPP") : <span>{t('pick_date')}</span>}
                              <CalendarIcon size={14} className="ml-auto opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl" align="start">
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
                      <FormItem><FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">{t('booking_time')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white font-bold rounded-xl border-gray-200">
                            <SelectValue placeholder={t('select_time')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="morning">{t('morning')}</SelectItem>
                          <SelectItem value="afternoon">{t('afternoon')}</SelectItem>
                          <SelectItem value="evening">{t('evening')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                    )} />
                  </div>
                )}

                <div className="space-y-4">
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('payment_method')}</FormLabel>
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
                </div>

                <Button type="submit" className="w-full h-16 font-black text-lg rounded-2xl shadow-xl mt-2 uppercase tracking-tight" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : t('place_order')}
                </Button>
              </form>
            </Form>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-2 bg-[#F9FAFB] p-6 md:p-10 border-l border-gray-100">
            <h3 className="text-lg font-black uppercase mb-8 border-b border-gray-200 pb-4 tracking-tighter">{t('order_summary')}</h3>
            
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
                <Input placeholder="Coupon Code" {...form.register('coupon')} className="h-10 text-xs bg-white border-gray-200 uppercase font-bold rounded-lg" />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="h-10 px-4 font-black bg-white border-primary text-primary hover:bg-primary/5 rounded-lg">APPLY</Button>
              </div>
              
              <div className="space-y-3 text-sm pt-4">
                <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-widest"><span>{t('subtotal')}</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-widest"><span>{t('tax')}</span><span>৳{(subtotal * 0.08).toLocaleString()}</span></div>
                <div className="flex justify-between text-2xl font-black text-gray-900 border-t-2 border-primary/10 pt-6 mt-4"><span>{t('total')}</span><span>৳{finalTotal.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4">
               <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><ShieldCheck size={18} /></div>
                  <p className="text-[9px] font-black uppercase text-gray-500 leading-tight">{t('secure_checkout')}</p>
               </div>
               <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="p-2 bg-white rounded-lg text-blue-600"><Zap size={18} /></div>
                  <p className="text-[9px] font-black uppercase text-blue-700 leading-tight">Fastest Booking System in Bangladesh</p>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
