"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Loader2, 
  Star, 
  Zap,
  Info,
  ChevronRight,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();
  const [pricingMode, setPricingMode] = useState<'cash' | 'regular'>('cash');

  const productRef = useMemoFirebase(() => db ? doc(db, 'products', id as string) : null, [db, id]);
  const { data: product, isLoading } = useDoc(productRef);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (!product) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center bg-white">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push('/')}>{t('back_to_shop')}</Button>
        </div>
      </PublicLayout>
    );
  }

  const handleOrderNow = () => {
    const finalPrice = pricingMode === 'cash' ? product.price : (product.regularPrice || product.price);
    addToCart({ ...product, price: finalPrice });
    setCheckoutOpen(true);
  };

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-8 gap-2 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Visual Showcase */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm relative group">
                <div className="relative aspect-square md:aspect-[4/3] flex items-center justify-center p-12">
                  <Image
                    src={product.imageUrl || 'https://picsum.photos/seed/prod/800/800'}
                    alt={product.name}
                    fill
                    className="object-contain p-8 md:p-16 group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                </div>
                <div className="absolute top-8 left-8 flex flex-col gap-3">
                  <Badge className="bg-primary text-white border-none px-4 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-xl">
                    New Arrival
                  </Badge>
                  <div className="flex items-center gap-1 bg-[#081621] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <Star size={12} fill="#FFD700" className="text-[#FFD700]" /> 5.0 Rating
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border shadow-sm space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Info className="text-primary" size={24} /> 
                  Detailed Specifications
                </h3>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { label: "Category", value: product.categoryId },
                    { label: "Brand", value: product.brand || "Smart Clean Pro" },
                    { label: "SKU / Model", value: product.id.slice(0, 8).toUpperCase() },
                    { label: "Warranty", value: "1 Year Service Warranty" },
                    { label: "Stock Availability", value: product.stockQuantity > 0 ? "Available" : "Pre-order" }
                  ].map((spec, i) => (
                    <div key={i} className="grid grid-cols-3 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-4 rounded-xl">
                      <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{spec.label}</span>
                      <span className="col-span-2 text-sm font-bold text-gray-700">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Conversion Panel */}
            <div className="lg:col-span-5 space-y-8 sticky top-24">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.2em]">
                  <Package size={16} /> {product.brand || 'Premium Equipment'}
                </div>
                <h1 className="text-4xl font-black tracking-tight text-[#081621] font-headline leading-tight">
                  {product.name}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.shortDescription}
                </p>
              </div>

              <div className="bg-white rounded-[2rem] border shadow-xl overflow-hidden">
                <div className="bg-[#081621] p-6 text-white flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-primary" /> Purchase Options
                  </h3>
                  <Badge variant="outline" className="text-white border-white/20 font-black text-[10px] uppercase">Secure Payment</Badge>
                </div>
                <div className="p-8 space-y-6">
                  <RadioGroup value={pricingMode} onValueChange={(v: any) => setPricingMode(v)} className="space-y-4">
                    <Label 
                      htmlFor="cash" 
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer",
                        pricingMode === 'cash' ? "border-primary bg-primary/5 ring-1 ring-primary shadow-inner" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value="cash" id="cash" className="w-5 h-5" />
                        <div>
                          <p className="text-2xl font-black text-primary">৳{product.price.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cash Discount Price</p>
                        </div>
                      </div>
                      <CheckCircle2 className={cn("text-primary", pricingMode === 'cash' ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </Label>

                    <Label 
                      htmlFor="regular" 
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer",
                        pricingMode === 'regular' ? "border-primary bg-primary/5 ring-1 ring-primary shadow-inner" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value="regular" id="regular" className="w-5 h-5" />
                        <div>
                          <p className="text-2xl font-black text-gray-900">৳{(product.regularPrice || product.price).toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Regular Price (Online/EMI)</p>
                        </div>
                      </div>
                      <CheckCircle2 className={cn("text-primary", pricingMode === 'regular' ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </Label>
                  </RadioGroup>

                  <Button 
                    onClick={handleOrderNow} 
                    className="w-full h-16 rounded-2xl font-black text-xl shadow-2xl shadow-primary/20 transition-all active:scale-95 group gap-3 uppercase tracking-tight"
                  >
                    Confirm Order Now <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-4">Standard Deliverables</h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Truck, label: "Fast Doorstep Delivery", desc: "Available nationwide in Bangladesh" },
                    { icon: ShieldCheck, label: "Official Warranty", desc: "100% Genuine product guarantee" }
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="p-3 bg-primary/5 rounded-xl text-primary shrink-0"><feat.icon size={24} /></div>
                      <div>
                        <p className="text-sm font-black text-[#081621] uppercase tracking-tight">{feat.label}</p>
                        <p className="text-xs text-muted-foreground font-medium">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="info" className="border-none">
                  <AccordionTrigger className="bg-white rounded-2xl px-8 border font-black uppercase text-xs tracking-widest hover:no-underline shadow-sm">
                    View More Product Information
                  </AccordionTrigger>
                  <AccordionContent className="pt-6 px-4 text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                    {product.description}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
