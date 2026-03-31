
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Clock, 
  Loader2, 
  Zap,
  Star,
  ChevronRight,
  Wrench,
  Users,
  Plus,
  Minus,
  Check,
  X,
  LayoutGrid,
  ShoppingCart,
  XCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ServiceBookingPage() {
  const { id: slugOrId } = useParams();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen, isCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [mainQuantity, setMainQuantity] = useState(1);
  const [selectedSqftId, setSelectedSqftId] = useState<string>('0');
  const [addOnsQty, setAddOnsQty] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Data Fetching
  const serviceQuery = useMemoFirebase(() => {
    if (!db || !slugOrId) return null;
    return query(collection(db, 'services'), where('slug', '==', slugOrId), limit(1));
  }, [db, slugOrId]);
  const { data: slugServices, isLoading: slugLoading } = useCollection(serviceQuery);

  const mainServiceRef = useMemoFirebase(() => (db && slugOrId) ? doc(db, 'services', slugOrId as string) : null, [db, slugOrId]);
  const { data: idService, isLoading: idLoading } = useDoc(mainServiceRef);

  const baseService = useMemo(() => {
    if (slugServices && slugServices.length > 0) return slugServices[0];
    return idService || null;
  }, [slugServices, idService]);

  const targetId = baseService?.id || null;

  const addOnsQuery = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', targetId), where('status', '==', 'Active'), where('isAddOnEnabled', '==', true));
  }, [db, targetId]);
  const { data: addOnOptions } = useCollection(addOnsQuery);

  // 2. Pricing Logic
  const pricingLogic = baseService?.pricingType || 'fixed';
  const selectedSlab = (pricingLogic === 'sqft' && baseService?.sqftOptions) ? baseService.sqftOptions[parseInt(selectedSqftId)] : null;
  
  const basePriceValue = useMemo(() => {
    if (!baseService) return 0;
    if (pricingLogic === 'sqft') return selectedSlab?.price || 0;
    return (baseService.basePrice || 0) * mainQuantity;
  }, [baseService, pricingLogic, selectedSlab, mainQuantity]);

  const addOnsTotal = useMemo(() => {
    if (!addOnOptions) return 0;
    return addOnOptions.reduce((acc, a) => acc + (a.price * (addOnsQty[a.id] || 0)), 0);
  }, [addOnOptions, addOnsQty]);

  const platformFee = 50;
  const totalPrice = basePriceValue + addOnsTotal + platformFee;

  const handleContinue = () => {
    if (!baseService || baseService.isBookingEnabled === false) return;
    
    const selectedAddOns = addOnOptions?.filter(a => (addOnsQty[a.id] || 0) > 0)
      .map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: addOnsQty[a.id]
      })) || [];

    const cartItem = {
      ...baseService,
      id: baseService.id,
      name: baseService.title,
      price: totalPrice,
      imageUrl: baseService.imageUrl || '',
      itemType: 'service' as const,
      selectedAddOns: selectedAddOns,
      slab: pricingLogic === 'sqft' ? selectedSlab?.label : null,
      quantity: 1 
    };

    addToCart(cartItem as any, 1, false);
    setCheckoutOpen(true);
  };

  if (!mounted || (slugLoading && idLoading)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!baseService) return <div className="p-20 text-center uppercase font-black text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F9FAFB] min-h-screen pb-24 lg:pb-12">
        
        <section className="container mx-auto px-0 md:px-4 py-0 md:py-4 max-w-7xl">
          <Card className="border-none shadow-2xl hover:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.15)] transition-shadow duration-700 rounded-none md:rounded-[3rem] overflow-hidden bg-white relative z-10 group">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              
              {/* Left Column: Media (5 Columns) */}
              <div className="lg:col-span-5 p-2 md:p-4 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-4">
                <div className="relative aspect-square w-full flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden">
                  {baseService.imageUrl ? (
                    <Image src={baseService.imageUrl} alt={baseService.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                  ) : (
                    <Wrench size={80} className="text-gray-200" />
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-3 py-1 rounded-sm shadow-2xl">Premium Selection</Badge>
                  </div>
                </div>

                {baseService.beforeAfterImages?.length > 0 && (
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-2">
                      {baseService.beforeAfterImages.map((img: any, i: number) => (
                        <CarouselItem key={i} className="pl-2 basis-1/2">
                          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-white shadow-md">
                            <Image src={img.url} alt={`Work ${i}`} fill className="object-cover" unoptimized />
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                              <span className="text-[7px] font-black text-white uppercase tracking-widest">{img.tag}</span>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                )}
              </div>

              {/* Middle Column: Booking Info (3 Columns) */}
              <div className="lg:col-span-3 p-4 md:p-6 flex flex-col gap-6 bg-white relative z-20">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h1 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tighter leading-tight font-headline">
                      {baseService.title}
                    </h1>
                    
                    <div className="flex items-center gap-2 py-3 border-y border-gray-50 overflow-x-auto no-scrollbar">
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-50/50 px-2 py-1 rounded-lg shrink-0">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[9px] font-black">{baseService.rating || '5.0'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50/50 px-2 py-1 rounded-lg shrink-0">
                        <Clock size={12} />
                        <span className="text-[9px] font-black uppercase">{baseService.duration || 'Flex'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg shrink-0">
                        <Users size={12} />
                        <span className="text-[9px] font-black uppercase">{baseService.teamSize || 'Pro'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                      <div className="text-left flex-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                        <span className="text-xl md:text-2xl font-black text-primary tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        {pricingLogic === 'sqft' && baseService.sqftOptions?.length ? (
                          <Select value={selectedSqftId} onValueChange={setSelectedSqftId}>
                            <SelectTrigger className="h-10 w-28 bg-white border-2 border-gray-100 rounded-xl text-[9px] font-black uppercase">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {baseService.sqftOptions.map((opt: any, idx: number) => (
                                <SelectItem key={idx} value={idx.toString()} className="text-[10px] font-black uppercase">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center bg-white rounded-xl overflow-hidden h-10 border-2 border-gray-100 shadow-sm">
                            <button onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))} className="px-3 h-full hover:bg-gray-50 text-gray-400"><Minus size={12} /></button>
                            <span className="px-3 font-black text-sm text-[#081621] min-w-[30px] text-center">{mainQuantity}</span>
                            <button onClick={() => setMainQuantity(mainQuantity + 1)} className="px-3 h-full hover:bg-gray-50 text-gray-400"><Plus size={12} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={handleContinue} 
                      disabled={baseService.isBookingEnabled === false}
                      className="hidden md:flex w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 gap-3 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white"
                    >
                      {baseService.bookingButtonText || 'Confirm Booking'} <ArrowRight size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Add-ons (4 Columns) */}
              <div className="lg:col-span-4 p-4 md:p-6 bg-gray-50/30 flex flex-col gap-4">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Add-on Services</h3>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Customize your plan</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap size={16} fill="currentColor" /></div>
                  </div>

                  <div className="space-y-2 max-h-[450px] overflow-y-auto no-scrollbar pr-1">
                    {addOnOptions?.length ? addOnOptions.map((addon) => {
                      const qty = addOnsQty[addon.id] || 0;
                      return (
                        <div 
                          key={addon.id}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all flex items-center justify-between bg-white group hover:shadow-md",
                            qty > 0 ? "border-primary ring-1 ring-primary/10 bg-primary/5" : "border-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                              {addon.imageUrl ? <Image src={addon.imageUrl} alt="+" fill className="object-cover" unoptimized /> : <Plus size={14} className="m-auto text-gray-300" />}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-[10px] font-black text-gray-900 uppercase truncate leading-none">{addon.name}</h5>
                              <p className="text-[11px] font-black text-primary mt-1">৳{addon.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1 border border-gray-200 shrink-0 ml-4">
                            <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: Math.max(0, (p[addon.id] || 0) - 1)}))} className="p-1 text-gray-400 hover:text-red-500"><Minus size={14}/></button>
                            <span className="text-[11px] font-black text-[#081621] min-w-[24px] text-center">{qty}</span>
                            <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: (p[addon.id] || 0) + 1}))} className="p-1 text-gray-400 hover:text-emerald-500"><Plus size={14}/></button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-20 text-center opacity-20">
                        <LayoutGrid size={32} className="mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Add-ons Available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </section>

        {/* Mobile Sticky CTA Bar - Hidden when Checkout is Open */}
        {mounted && !isCheckoutOpen && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[155] bg-white border-t border-gray-100 h-20 px-4 flex items-center justify-between gap-4 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] pb-safe-offset-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Payable</span>
              <span className="text-2xl font-black text-primary tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinue} 
              disabled={baseService.isBookingEnabled === false} 
              className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              {baseService.bookingButtonText || 'Confirm Booking'}
            </Button>
          </div>
        )}

      </div>
    </PublicLayout>
  );
}
