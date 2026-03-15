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
import { Loader2, CheckCircle2, CalendarIcon, Wallet, CreditCard } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
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
  const db = useFirestore();
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
      time: "",
      paymentMethod: defaultPayment,
      notes: "",
    },
  });

  useEffect(() => {
    form.setValue('paymentMethod', hasServices ? "cash_in_hand" : "cod");
  }, [hasServices, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db) return;
    setIsSubmitting(true);
    
    const collectionName = hasServices ? 'bookings' : 'orders';
    const orderData = {
      customerId: user?.uid || 'guest',
      customerName: values.name,
      customerPhone: values.phone,
      customerEmail: values.email,
      address: values.address,
      items,
      totalPrice: subtotal * 1.08, // Including tax
      paymentMethod: values.paymentMethod,
      status: 'New',
      notes: values.notes,
      dateTime: values.date?.toISOString() || new Date().toISOString(),
      timeSlot: values.time,
      createdAt: new Date().toISOString(),
    };

    addDoc(collection(db, collectionName), orderData)
      .then((docRef) => {
        setIsSubmitting(false);
        clearCart();
        router.push(`/order-success?id=${docRef.id}`);
      })
      .catch(async (error) => {
        setIsSubmitting(false);
        const permissionError = new FirestorePermissionError({
          path: collectionName,
          operation: 'create',
          requestResourceData: orderData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('empty_cart')}</h2>
        <Button onClick={() => router.push('/')} className="rounded-full px-8">{t('browse_catalog')}</Button>
      </div>
    );
  }

  return (
    <div className="bg-[#F2F4F8] min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 font-headline text-[#081621]">{t('checkout_title')}</h1>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b p-6">
                  <CardTitle className="text-xl font-bold">{t('delivery_info')}</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">{t('full_name')}</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} className="h-12 bg-[#F9FAFB]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">{t('phone_number')}</FormLabel>
                              <FormControl>
                                <Input placeholder="+880 1XXX-XXXXXX" {...field} className="h-12 bg-[#F9FAFB]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">{t('email_optional')}</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" {...field} className="h-12 bg-[#F9FAFB]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">{t('delivery_address')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="House, Street, Area, City" 
                                className="min-h-[100px] bg-[#F9FAFB]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {hasServices && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-xl border border-primary/20">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="font-bold">{t('booking_date')}</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "h-12 w-full pl-3 text-left font-normal bg-white",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>{t('pick_date')}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) =>
                                        date < new Date() || date < new Date("1900-01-01")
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold">{t('booking_time')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 bg-white">
                                      <SelectValue placeholder={t('select_time')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="morning">{t('morning')}</SelectItem>
                                    <SelectItem value="afternoon">{t('afternoon')}</SelectItem>
                                    <SelectItem value="evening">{t('evening')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="space-y-4">
                        <FormLabel className="font-bold text-lg">{t('payment_method')}</FormLabel>
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="grid grid-cols-1 gap-4"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <FormControl>
                                      <RadioGroupItem value="cod" disabled={hasServices} />
                                    </FormControl>
                                    <FormLabel className="font-medium flex items-center gap-3 cursor-pointer w-full">
                                      <div className="p-2 bg-muted rounded-full text-muted-foreground group-checked:text-primary">
                                        <Wallet size={18} />
                                      </div>
                                      <div className="flex flex-col">
                                        <span>{t('payment_cod')}</span>
                                        {hasServices && <span className="text-[10px] text-destructive">Products only</span>}
                                      </div>
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <FormControl>
                                      <RadioGroupItem value="cash_in_hand" />
                                    </FormControl>
                                    <FormLabel className="font-medium flex items-center gap-3 cursor-pointer w-full">
                                      <div className="p-2 bg-muted rounded-full text-muted-foreground">
                                        <CreditCard size={18} />
                                      </div>
                                      <div className="flex flex-col">
                                        <span>{t('payment_cash_hand')}</span>
                                        <span className="text-[10px] text-muted-foreground italic">Preferred for bookings</span>
                                      </div>
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">{t('order_notes')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="..." 
                                className="bg-[#F9FAFB]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full h-14 font-bold text-lg rounded-xl shadow-lg" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t('processing')}
                          </>
                        ) : (
                          t('place_order')
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card className="rounded-2xl border-none shadow-sm sticky top-24">
                <CardHeader className="p-6 border-b">
                  <CardTitle className="text-lg font-bold">{t('order_summary')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#081621]">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            x{item.quantity} {item.itemType === 'service' ? `(${t('price_from')})` : ''}
                          </span>
                        </div>
                        <span className="font-bold text-sm">৳{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('subtotal')}</span>
                        <span className="font-medium">৳{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('tax')}</span>
                        <span className="font-medium">৳{(subtotal * 0.08).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-black text-xl pt-2 text-primary border-t-2 border-primary/10">
                        <span>{t('total')}</span>
                        <span>৳{(subtotal * 1.08).toLocaleString()}</span>
                      </div>
                      {hasServices && (
                        <p className="text-[10px] text-center italic text-muted-foreground mt-2">
                          {t('service_billing_note')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 flex items-center gap-3 p-5 bg-white rounded-2xl text-[#081621] text-sm shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <CheckCircle2 size={20} />
                </div>
                <p className="font-semibold">{t('secure_checkout')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
