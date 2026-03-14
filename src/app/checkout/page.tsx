"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(10, "Please provide a complete delivery address"),
  notes: z.string().optional(),
});

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setIsSubmitting(false);
    clearCart();
    router.push(`/order-success?id=${orderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('empty_cart')}</h2>
        <Button onClick={() => router.push('/')}>{t('browse_catalog')}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-10 font-headline">{t('checkout_title')}</h1>

        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('delivery_info')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('full_name')}</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                            <FormLabel>{t('phone_number')}</FormLabel>
                            <FormControl>
                              <Input placeholder="+880 1XXX-XXXXXX" {...field} />
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
                          <FormLabel>{t('email_optional')}</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
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
                          <FormLabel>{t('delivery_address')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="House, Street, Area, City" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('order_notes')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full font-bold" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

          <div className="md:col-span-2">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg">{t('order_summary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} <span className="text-xs font-bold">x{item.quantity}</span>
                      </span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('subtotal')}</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('tax')}</span>
                      <span>${(subtotal * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>{t('total')}</span>
                      <span className="text-primary">${(subtotal * 1.08).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 flex items-center gap-3 p-4 bg-primary/5 rounded-lg text-primary text-sm border border-primary/20">
              <CheckCircle2 size={18} />
              <p>{t('secure_checkout')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}