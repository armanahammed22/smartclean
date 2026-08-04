
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
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Award,
  ThumbsUp,
  Info,
  Building2,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ServiceBookingPage() {
  const { id: slugOrId } = useParams();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen, isCheckoutOpen } = useCart();
  const db = useFirestore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [mainQuantity, setMainQuantity] = useState(1);
  const [selectedSqftId, setSelectedSqftId] = useState<string>('0');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🛡️ SEO Optimization: Try fetching by Slug first
  const serviceBySlugQuery = useMemoFirebase(() => {
    if (!db || !slugOrId) return null;
    return query(collection(db, 'services'), where('slug', '==', slugOrId), limit(1));
  }, [db, slugOrId]);
  const { data: slugServices, isLoading: slugLoading } = useCollection(serviceBySlugQuery);

  // 🛡️ Fallback: Try fetching by ID
  const mainServiceRef = useMemoFirebase(() => (db && slugOrId) ? doc(db, 'services', slugOrId as string) : null, [db, slugOrId]);
  const { data: idService, isLoading: idLoading } = useDoc(mainServiceRef);

  const baseService = useMemo(() => {
    if (slugServices && slugServices.length > 0) return slugServices[0];
    return idService || null;
  }, [slugServices, idService]);

  // 🛡️ Canonical SEO Redirect
  useEffect(() => {
    if (baseService && baseService.slug && slugOrId !== baseService.slug) {
      router.replace(`/service/${baseService.slug}`);
    }
  }, [baseService, slugOrId, router]);

  const targetId = baseService?.id || null;

  const addOnsQuery = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', targetId), where('status', '==', 'Active'), where('isAddOnEnabled', '==', true));
  }, [db, targetId]);
  const { data: addOnOptions } = useCollection(addOnsQuery);

  const pricingLogic = baseService?.pricingType || 'fixed';
  const selectedSlab = (pricingLogic === 'sqft' && baseService?.sqftOptions) ? baseService.sqftOptions[parseInt(selectedSqftId)] : null;
  
  const basePriceValue = useMemo(() => {
    if (!baseService) return 0;
    if (pricingLogic === 'sqft') return selectedSlab?.price || 0;
    return (baseService.basePrice || 0) * mainQuantity;
  }, [baseService, pricingLogic, selectedSlab, mainQuantity]);

  const addOnsTotal = useMemo(() => {
    if (!addOnOptions) return 0;
    return addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0) || 0;
  }, [addOnOptions, selectedAddOnIds]);

  const platformFee = 0; 
  const totalPrice = basePriceValue + addOnsTotal + platformFee;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleContinue = () => {
    if (!baseService || baseService.isBookingEnabled === false) return;
    
    const cartItem = {
      ...baseService,
      id: baseService.id,
      name: baseService.title,
      price: totalPrice,
      imageUrl: baseService.imageUrl || '',
      itemType: 'service' as const,
      slab: pricingLogic === 'sqft' ? selectedSlab?.label : null,
      quantity: 1 
    };

    addToCart(cartItem as any, 1, false);
    setCheckoutOpen(true);
  };

  if (!mounted || (slugLoading && idLoading)) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!baseService) return <div className="p-20 text-center uppercase font-black text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-24 lg:pb-12">
        
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: IMAGE & BEFORE/AFTER */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <div className="relative aspect-square w-full flex items-center justify-center bg-gray-50 group">
                  {baseService.imageUrl ? (
                    <Image src={baseService.imageUrl} alt={baseService.title} fill className="object-cover" unoptimized />
                  ) : (
                    <Wrench size={80} className="text-gray-200" />
                  )}
                  <div className="absolute top-6 left-6">
                     <Badge className="bg-primary text-white border-none rounded-full px-4 py-1.5 font-black text-[10px] uppercase shadow-lg tracking-widest">Verified Service</Badge>
                  </div>
                </div>
              </Card>

              {baseService.beforeAfterImages?.length > 0 && (
                <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-white space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#081621]">Operational Results</h4>
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-3">
                      {baseService.beforeAfterImages.map((img: any, i: number) => (
                        <CarouselItem key={i} className="pl-3 basis-1/2 md:basis-1/3">
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                            <Image src={img.url} alt={`Work ${i}`} fill className="object-cover" unoptimized />
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                              <span className="text-[7px] font-black text-white uppercase tracking-widest">{img.tag}</span>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </Card>
              )}
            </div>

            {/* COLUMN 2: TITLE & BOOKING */}
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-[#081621] uppercase tracking-tighter leading-none font-headline italic">
                    {baseService.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black">{baseService.rating || '4.9'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest underline decoration-dashed">48 Reviews</span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 transition-all hover:shadow-md">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Rate Starting</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary tracking-tighter transition-all duration-300">৳{totalPrice.toLocaleString()}</span>
                      {baseService.regularPrice && baseService.regularPrice > baseService.basePrice && (
                        <span className="text-sm text-gray-400 line-through font-bold">৳{baseService.regularPrice}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    {pricingLogic === 'sqft' && baseService.sqftOptions?.length ? (
                      <div className="space-y-2">
                         <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Workload Scale (Sqft)</Label>
                         <Select value={selectedSqftId} onValueChange={setSelectedSqftId}>
                            <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner">
                               <SelectValue placeholder="Select Area Size" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                               {baseService.sqftOptions.map((opt: any, idx: number) => (
                                  <SelectItem key={idx} value={idx.toString()} className="py-3 font-bold text-xs uppercase">{opt.label}</SelectItem>
                               ))}
                            </SelectContent>
                         </Select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl shadow-inner border border-gray-100">
                        <div className="space-y-0.5 px-2">
                          <p className="text-[10px] font-black uppercase text-gray-400 leading-none">Quantity</p>
                          <p className="text-sm font-black text-gray-900">{mainQuantity} Unit(s)</p>
                        </div>
                        <div className="flex items-center bg-white rounded-xl shadow-sm border overflow-hidden h-10">
                          <button onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))} className="px-3 h-full hover:bg-gray-50 text-gray-400 border-r"><Minus size={14} /></button>
                          <button onClick={() => setMainQuantity(mainQuantity + 1)} className="px-3 h-full hover:bg-gray-50 text-gray-400"><Plus size={14} /></button>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleContinue}
                      className="w-full h-16 rounded-[2rem] bg-primary hover:bg-[#15435a] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-3 group transition-all hover:scale-[1.02]"
                    >
                      {baseService.bookingButtonText || 'Confirm Booking'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: ADD-ONS */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2 px-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap size={20} fill="currentColor"/></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#081621]">Power-Up Add-ons</h3>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-4">
                {addOnOptions?.length ? addOnOptions.map((addon, idx) => {
                  const isSelected = selectedAddOnIds.includes(addon.id);
                  return (
                    <div 
                      key={addon.id} 
                      onClick={() => toggleAddOn(addon.id)}
                      className={cn(
                        "relative flex flex-col p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer group shadow-sm",
                        isSelected 
                          ? "border-primary bg-emerald-50 shadow-lg ring-1 ring-primary/20 animate-in zoom-in-95" 
                          : "border-transparent bg-white hover:border-primary/20 hover:shadow-xl hover:-translate-y-1"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "relative w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 overflow-hidden",
                          isSelected ? "bg-primary border-primary rotate-3" : "bg-gray-50 border-gray-100 group-hover:rotate-3 shadow-inner"
                        )}>
                          {addon.imageUrl ? (
                            <Image src={addon.imageUrl} alt={addon.name} fill className={cn("object-contain p-2", isSelected && "brightness-0 invert")} unoptimized />
                          ) : (
                            <Zap size={20} className={cn(isSelected ? "text-white" : "text-gray-300")} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                             <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{addon.name}</h5>
                             <span className="text-xs font-black text-emerald-600 shrink-0">৳{addon.price}</span>
                          </div>
                          <p className="text-[9px] text-gray-400 font-bold leading-relaxed line-clamp-1 uppercase tracking-tighter">
                            {addon.description || "Enhanced treatment for superior results."}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-4 right-4 bg-primary text-white rounded-full p-1 shadow-lg animate-in fade-in slide-in-from-right-2">
                           <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="py-20 text-center opacity-30 border-2 border-dashed rounded-[3rem] bg-gray-50 flex flex-col items-center gap-4">
                    <Sparkles size={40} className="text-gray-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Add-ons Available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🔍 UNIFIED INFORMATION BLOCK */}
          <section className="pt-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
              <CardContent className="p-0 flex flex-col divide-y divide-gray-100">
                
                {/* TOP GRID: PROFILE, WHY US, INCLUDED, NOT INCLUDED */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-y-0 md:divide-x divide-gray-100">
                  
                  {/* Column 1: Service Quick Stats */}
                  <div className="p-6 md:p-8 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                      <Info size={18} className="text-primary" /> Service Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</p>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg px-2.5 py-1 font-bold text-[9px] uppercase">
                           {baseService.categoryId || 'General'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Service Hours</p>
                        <p className="text-[10px] font-black text-gray-700 flex items-center gap-1.5"><Clock size={12} className="text-primary"/> 8AM-8PM</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                        <p className="text-[10px] font-black text-gray-700 uppercase">{baseService.duration || '2-4 Hours'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Team Size</p>
                        <p className="text-[10px] font-black text-gray-700 uppercase">{baseService.teamSize || '2-3 Pros'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Why Choose Us */}
                  <div className="p-6 md:p-8 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <ThumbsUp size={18} /> Why Us
                    </h3>
                    <div className="space-y-5">
                      {[
                        { icon: ShieldCheck, title: "Verified Pros", desc: "Expert, background-checked team." },
                        { icon: Zap, title: "Modern Gear", desc: "Industrial high-grade equipment." },
                        { icon: Award, title: "Guarantee", desc: "24-hr satisfaction re-cleaning." }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 group/item">
                          <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover/item:text-primary transition-colors shrink-0 h-fit"><item.icon size={16}/></div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">{item.title}</p>
                            <p className="text-[9px] font-medium text-gray-500 leading-normal">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: What's Included */}
                  <div className="p-6 md:p-8 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Included
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {(baseService.included?.length ? baseService.included : ["Industrial Vacuuming", "Chemical Scrubbing", "Spot Treatment", "Sanitization"]).map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5 animate-in slide-in-from-left-2">
                          <div className="p-0.5 bg-emerald-100 text-emerald-600 rounded-full mt-0.5 shrink-0"><Check size={9} strokeWidth={4}/></div>
                          <span className="text-[10px] md:text-[11px] font-bold text-gray-600 uppercase tracking-tight leading-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Not Included */}
                  <div className="p-6 md:p-8 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-rose-700 flex items-center gap-2">
                      <AlertCircle size={18} /> Not Included
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {(baseService.notIncluded?.length ? baseService.notIncluded : ["Wall Painting", "Furniture Moving", "Deep Stain Removal", "Electronic Repair"]).map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5 animate-in slide-in-from-left-2 opacity-70">
                          <div className="p-0.5 bg-rose-100 text-rose-600 rounded-full mt-0.5 shrink-0"><X size={9} strokeWidth={4}/></div>
                          <span className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-tight leading-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* BOTTOM ROW: FULL WIDTH DESCRIPTION */}
                <div className="p-8 md:p-12 space-y-6 bg-white w-full">
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-[#081621] font-headline">
                      Detailed <span className="text-primary">Information</span>
                    </h3>
                  </div>
                  <div className="w-full max-w-none">
                    <div className="text-sm md:text-base font-medium text-gray-600 leading-[1.8] md:leading-[2] whitespace-pre-wrap break-words w-full">
                      {baseService.description || "No detailed information provided for this service."}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </section>

        </div>

        {/* 📱 MOBILE STICKY BAR */}
        {!isCheckoutOpen && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[155] bg-white border-t border-gray-100 h-20 px-4 flex items-center justify-between gap-4 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] pb-safe-offset-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Payable</span>
              <span className="text-2xl font-black text-primary tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button onClick={handleContinue} disabled={baseService.isBookingEnabled === false} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
              {baseService.bookingButtonText || 'Confirm Booking'}
            </Button>
          </div>
        )}

      </div>
    </PublicLayout>
  );
}
