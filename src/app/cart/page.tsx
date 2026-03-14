"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Info } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, itemCount } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
        <div className="bg-muted p-6 rounded-full mb-6">
          <ShoppingBag size={48} className="text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{t('empty_cart')}</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          {t('empty_cart_desc')}
        </p>
        <Button asChild size="lg">
          <Link href="/">{t('browse_catalog')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-10 font-headline">{t('cart_title')} ({itemCount})</h1>
      
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  <div className="relative w-full sm:w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="p-4 bg-primary/10 text-primary rounded-full">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {item.itemType === 'service' && (
                            <Badge variant="outline" className="text-[10px] py-0 border-primary text-primary">
                              {t('services_title')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">৳{(item.price * item.quantity).toLocaleString()}</p>
                        {item.itemType === 'service' && (
                          <span className="text-[10px] text-muted-foreground italic">({t('price_from')})</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-md h-9 bg-muted/30">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={16} />
                        {t('remove')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {items.some(item => item.itemType === 'service') && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-3 text-primary text-sm">
              <Info className="shrink-0 mt-0.5" size={18} />
              <p>{t('service_billing_note') || "Note: Service amounts are base prices and may vary based on actual work requirements."}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-primary/20 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">{t('order_summary')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('subtotal')}</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('shipping')}</span>
                  <span className="text-green-600 font-medium">{t('shipping_free')}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('tax')}</span>
                  <span>৳{(subtotal * 0.08).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <div className="text-right">
                    <span className="text-primary">৳{(subtotal * 1.08).toLocaleString()}</span>
                    {items.some(i => i.itemType === 'service') && (
                      <p className="text-[10px] text-muted-foreground block leading-none mt-1">{t('price_from')}</p>
                    )}
                  </div>
                </div>
              </div>
              <Button asChild className="w-full mt-8 gap-2 font-bold" size="lg">
                <Link href="/checkout">
                  {t('proceed_to_checkout')}
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
