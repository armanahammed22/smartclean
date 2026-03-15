
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  Loader2, 
  Star, 
  Heart, 
  Scale, 
  Minus, 
  Plus,
  Store,
  Zap
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
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();
  const [quantity, setQuantity] = useState(1);
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
    addToCart(product, quantity);
    setCheckoutOpen(true);
  };

  const finalPrice = pricingMode === 'cash' ? product.price : (product.regularPrice || product.price);

  return (
    <PublicLayout>
      <div className="bg-[#F2F4F8] min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b lg:hidden px-4 h-14 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-bold text-sm truncate">{product.name}</h1>
        </div>

        <div className="container mx-auto px-0 md:px-4 py-0 md:py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-8">
            
            {/* Left: Image Slider Section */}
            <div className="lg:col-span-7 space-y-4 md:space-y-6">
              <div className="bg-white md:rounded-[2.5rem] overflow-hidden relative border-b md:border shadow-sm">
                <Carousel className="w-full">
                  <CarouselContent>
                    {[1, 2, 3].map((i) => (
                      <CarouselItem key={i}>
                        <div className="relative aspect-square md:aspect-[4/3] bg-white flex items-center justify-center p-8">
                          <Image
                            src={product.imageUrl || 'https://picsum.photos/seed/prod/800/800'}
                            alt={`${product.name} - View ${i}`}
                            fill
                            className="object-contain p-4 md:p-12"
                            priority={i === 1}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                
                {/* Rating & Action Badges */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-3">
                  <div className="flex items-center gap-1 bg-[#081621] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <Star size={12} fill="#FFD700" className="text-[#FFD700]" /> 5.0 / 5
                  </div>
                </div>
                
                <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                  <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur-md">
                    <Heart size={18} className="text-gray-400" />
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur-md">
                    <Scale size={18} className="text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* Specifications / Features Section (Desktop) */}
              <div className="hidden lg:block bg-white rounded-[2.5rem] p-10 border shadow-sm space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Technical Specifications</h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: "Category", value: product.categoryId },
                    { label: "Brand", value: product.brand || "Smart Clean Pro" },
                    { label: "Model", value: product.id.slice(0, 8).toUpperCase() },
                    { label: "Warranty", value: "1 Year Official" },
                    { label: "Stock Status", value: product.stockQuantity > 0 ? "In Stock" : "Out of Stock" }
                  ].map((spec, i) => (
                    <div key={i} className="grid grid-cols-3 py-3 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{spec.label}</span>
                      <span className="col-span-2 text-sm font-bold text-gray-700">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Product Information */}
            <div className="lg:col-span-5 p-6 md:p-0 space-y-6">
              <div className="space-y-4">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-[#081621] font-headline leading-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                    Price: ৳{product.price.toLocaleString()}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-500 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                    Reg. Price: ৳{product.regularPrice?.toLocaleString() || product.price.toLocaleString()}
                  </Badge>
                  <Badge className={cn(
                    "border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest",
                    product.stockQuantity > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                    Brand: {product.brand || 'Pro'}
                  </Badge>
                </div>
              </div>

              {/* Key Features Section */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Key Features</h3>
                <ul className="space-y-3">
                  {(product.features || [
                    "High performance industrial grade motor",
                    "Advanced safety features & sensors",
                    "Energy efficient power consumption",
                    "1 Year Official Smart Clean Warranty"
                  ]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing & Selection Card */}
              <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">
                <div className="bg-[#081621] p-4 text-white">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> Payment Options
                  </h3>
                </div>
                <div className="p-6">
                  <RadioGroup value={pricingMode} onValueChange={(v: any) => setPricingMode(v)} className="space-y-4">
                    <Label 
                      htmlFor="cash" 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                        pricingMode === 'cash' ? "border-primary bg-primary/5 shadow-inner" : "border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="cash" id="cash" />
                        <div>
                          <p className="text-xl font-black text-primary">৳{product.price.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Cash Discount Price</p>
                        </div>
                      </div>
                      <CheckCircle2 className={cn("text-primary", pricingMode === 'cash' ? "opacity-100" : "opacity-0")} />
                    </Label>

                    <Label 
                      htmlFor="regular" 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                        pricingMode === 'regular' ? "border-primary bg-primary/5 shadow-inner" : "border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="regular" id="regular" />
                        <div>
                          <p className="text-xl font-black text-gray-900">৳{(product.regularPrice || product.price).toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Regular Price (EMI/Card)</p>
                        </div>
                      </div>
                      <CheckCircle2 className={cn("text-primary", pricingMode === 'regular' ? "opacity-100" : "opacity-0")} />
                    </Label>
                  </RadioGroup>
                </div>
              </div>

              {/* Store & Stock Status */}
              <div className="flex gap-4">
                <div className="flex-1 bg-white rounded-2xl p-4 border border-dashed flex flex-col items-center justify-center text-center gap-1 group cursor-pointer hover:border-primary transition-colors">
                  <Store size={20} className="text-gray-400 group-hover:text-primary" />
                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">Find in Store</span>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-4 border border-dashed flex flex-col items-center justify-center text-center gap-1">
                  <Truck size={20} className="text-gray-400" />
                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">Fast Delivery</span>
                </div>
              </div>

              <div className="pb-24 lg:pb-0" /> {/* Spacer for sticky footer */}
            </div>
          </div>
        </div>

        {/* Sticky Mobile Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-4 flex items-center gap-4 lg:hidden">
          <div className="flex items-center border rounded-xl h-12 bg-gray-50">
            <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-full rounded-none">
              <Minus size={16} />
            </Button>
            <span className="w-10 text-center font-black">{quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-full rounded-none">
              <Plus size={16} />
            </Button>
          </div>
          <Button 
            onClick={handleOrderNow} 
            className="flex-1 h-12 rounded-xl font-black uppercase tracking-tight shadow-lg"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
