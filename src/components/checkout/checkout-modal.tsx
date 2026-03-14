
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  CalendarIcon, 
  Wallet, 
  CreditCard, 
  ShieldCheck, 
  Smartphone,
  Trash2,
  Minus,
  Plus,
  ShoppingCart
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Address required"),
  date: z.date().optional(),
  time: z.string().optional(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

export function CheckoutModal() {
  const { 
    items, 
    subtotal, 
    clearCart, 
    isCheckoutOpen, 
    setCheckoutOpen, 
    updateQuantity, 
    removeFromCart 
  } = useCart();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const hasServices = items.some(i => i.itemType === 'service');
  const defaultPayment = hasServices ? "cash_in_hand" : "cod";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      time: "",
      paymentMethod: defaultPayment,
      notes: "",
    },
  });

  useEffect(() => {
    if (isCheckoutOpen) {
      form.setValue('paymentMethod', hasServices ? "cash_in_hand" : "cod");
    }
  }, [isCheckoutOpen, hasServices, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    // Simulate SSL Secure Payment Processing
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const orderId = `SC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setIsSubmitting(false);
    clearCart();
    setCheckoutOpen(false);
    router.push(`/order-success?id=${orderId}`);
  };

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto p-0 border-none rounded-2xl">
        <div className="grid lg:grid-cols-5 h-full">
          {/* Form Side */}
          <div className="lg:col-span-3 p-5 md:p-8 bg-white">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl md:text-2xl font-bold font-headline">{t('checkout_title')}</DialogTitle>
                  <DialogDescription className="text-xs">{t('delivery_info')}</DialogDescription>
                </div>
                {/* Mobile Cart Preview */}
                <div className="lg:hidden flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full text-primary">
                  <ShoppingCart size={16} />
                  <span className="text-xs font-bold">৳{(subtotal * 1.08).toLocaleString()}</span>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">{t('full_name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="h-10 bg-muted/30 text-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">{t('phone_number')}</FormLabel>
                        <FormControl>
                          <Input placeholder="+880 1XXX-XXXXXX" {...field} className="h-10 bg-muted/30 text-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider">{t('delivery_address')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="House, Street, Area, City" 
                          className="min-h-[70px] bg-muted/30 text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {hasServices && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider">{t('booking_date')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "h-10 w-full pl-3 text-left font-normal bg-white text-sm",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span className="text-xs">{t('pick_date')}</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider">{t('booking_time')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-white text-sm">
                                <SelectValue placeholder={t('select_time')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">{t('morning')}</SelectItem>
                              <SelectItem value="afternoon">{t('afternoon')}</SelectItem>
                              <SelectItem value="evening">{t('evening')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider">{t('payment_method')}</FormLabel>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <RadioGroupItem value="cod" id="cod" disabled={hasServices} />
                          <label htmlFor="cod" className="text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                            <Wallet size={12} /> {t('payment_cod')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <RadioGroupItem value="cash_in_hand" id="cash_in_hand" />
                          <label htmlFor="cash_in_hand" className="text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                            <Smartphone size={12} /> {t('payment_cash_hand')}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <RadioGroupItem value="bkash" id="bkash" />
                          <label htmlFor="bkash" className="text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                            bKash / Nagad
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <RadioGroupItem value="card" id="card" />
                          <label htmlFor="card" className="text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                            <CreditCard size={12} /> Card (SSL)
                          </label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full h-12 font-bold rounded-xl shadow-lg mt-2" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('processing')}</> : t('place_order')}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                  <ShieldCheck size={12} className="text-green-600" />
                  <span>{t('secure_checkout')}</span>
                </div>
              </form>
            </Form>
          </div>

          {/* Cart Side - Hidden on smaller mobile if modal is too tall, but overflow handles it */}
          <div className="lg:col-span-2 bg-[#F9FAFB] p-5 md:p-6 border-l hidden lg:block">
            <h3 className="text-lg font-bold mb-6 border-b pb-2">{t('order_summary')}</h3>
            <div className="space-y-4 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto pr-2 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-white p-2 rounded-lg shadow-sm group">
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <Smartphone size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border rounded h-6 bg-muted/50">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-1 hover:text-primary"><Minus size={10} /></button>
                        <span className="text-[10px] w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-1 hover:text-primary"><Plus size={10} /></button>
                      </div>
                      <span className="text-xs font-black text-primary">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-bold">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('tax')}</span>
                <span className="font-bold">৳{(subtotal * 0.08).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-primary border-t-2 border-primary/10 pt-2">
                <span>{t('total')}</span>
                <span>৳{(subtotal * 1.08).toLocaleString()}</span>
              </div>
              {hasServices && <p className="text-[9px] italic text-muted-foreground text-center mt-2">{t('service_billing_note')}</p>}
            </div>
          </div>
          
          {/* Mobile Order Summary (at bottom) */}
          <div className="lg:hidden bg-[#F9FAFB] p-5 border-t">
            <button 
              onClick={() => {
                const el = document.getElementById('mobile-cart-items');
                if (el) el.classList.toggle('hidden');
              }}
              className="w-full flex justify-between items-center text-sm font-bold mb-2"
            >
              <span>{t('order_summary')}</span>
              <span className="text-primary">৳{(subtotal * 1.08).toLocaleString()}</span>
            </button>
            <div id="mobile-cart-items" className="hidden space-y-2 pt-2">
               {items.map((item) => (
                 <div key={item.id} className="flex justify-between text-xs">
                   <span>{item.name} x{item.quantity}</span>
                   <span>৳{(item.price * item.quantity).toLocaleString()}</span>
                 </div>
               ))}
               <Separator className="my-2" />
               <div className="flex justify-between text-xs font-bold">
                 <span>{t('total')}</span>
                 <span className="text-primary">৳{(subtotal * 1.08).toLocaleString()}</span>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
