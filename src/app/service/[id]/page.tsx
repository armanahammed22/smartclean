
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  Clock, 
  Loader2, 
  Zap,
  Star,
  CheckCircle2,
  ChevronRight,
  Wrench,
  Users,
  Plus,
  Minus,
  Check,
  X,
  Calendar,
  Sparkles,
  LayoutGrid,
  Send,
  MessageSquare,
  ShoppingCart,
  XCircle,
  Quote,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, addDoc, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ServiceBookingPage() {
  const { id: slugOrId } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [mainQuantity, setMainQuantity] = useState(1);
  const [selectedSqftId, setSelectedSqftId] = useState<string | null>(null);
  const [addOnsQty, setAddOnsQty] = useState<Record<string, number>>({});
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Data Fetching Queries
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

  const userBookingsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'bookings'), where('customerId', '==', user.uid)) : null, [db, user]);
  const { data: userBookings } = useCollection(userBookingsQuery);

  const reviewsRef = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    return collection(db, 'services', targetId, 'reviews');
  }, [db, targetId]);
  const { data: allReviewsRaw } = useCollection(reviewsRef);

  const reviews = useMemo(() => {
    if (!allReviewsRaw) return [];
    return allReviewsRaw
      .filter(r => r.status === 'Approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allReviewsRaw]);

  const canSubmitReview = useMemo(() => {
    if (!userBookings || !targetId) return false;
    return userBookings.some(b => b.serviceId === targetId && b.status === 'Completed');
  }, [userBookings, targetId]);

  // 2. Pricing Logic & Calculations
  const pricingLogic = baseService?.pricingType || 'fixed';
  const selectedSlab = (pricingLogic === 'sqft' && selectedSqftId !== null && baseService?.sqftOptions) ? baseService.sqftOptions[parseInt(selectedSqftId)] : null;
  
  const basePriceValue = useMemo(() => {
    if (!baseService) return 0;
    if (pricingLogic === 'sqft') return selectedSlab?.price || 0;
    if (pricingLogic === 'quantity') return (baseService.basePrice || 0) * mainQuantity;
    return baseService.basePrice || 0; // Fixed
  }, [baseService, pricingLogic, selectedSlab, mainQuantity]);

  const addOnsTotal = useMemo(() => {
    if (!addOnOptions) return 0;
    return addOnOptions.reduce((acc, a) => acc + (a.price * (addOnsQty[a.id] || 0)), 0);
  }, [addOnOptions, addOnsQty]);

  const platformFee = 50;
  const totalPrice = basePriceValue + addOnsTotal + platformFee;

  useEffect(() => {
    if (baseService?.pricingType === 'sqft' && baseService.sqftOptions?.length) {
      setSelectedSqftId('0');
    }
  }, [baseService]);

  // 3. Handlers
  const handleContinue = () => {
    if (!baseService || !baseService.isBookingEnabled) return;
    
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
      quantity: 1 // We add 1 "service package"
    };

    addToCart(cartItem as any, 1, false);
    setCheckoutOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !targetId || !canSubmitReview) return;
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'services', targetId, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        rating: reviewRating,
        text: reviewText,
        createdAt: new Date().toISOString(),
        status: 'Approved'
      });
      setReviewText('');
      setReviewRating(5);
      toast({ title: "Review Shared", description: "Thank you for your feedback!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmittingReview(false);
    }
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
          <Card className="border-none shadow-2xl hover:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] transition-shadow duration-700 rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white relative z-10 group">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              
              {/* Media Gallery - Span 5 */}
              <div className="lg:col-span-5 p-2 md:p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-4">
                <div className="relative aspect-square w-full flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden">
                  {baseService.imageUrl ? (
                    <Image src={baseService.imageUrl} alt={baseService.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                  ) : (
                    <Wrench size={80} className="text-gray-200" />
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-3 py-1 rounded-sm shadow-2xl">Verified Service</Badge>
                  </div>
                </div>

                {baseService.beforeAfterImages?.length > 0 && (
                  <div className="space-y-3">
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
                  </div>
                )}
              </div>

              {/* Booking Info - Span 3 */}
              <div className="lg:col-span-3 p-4 md:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-4 bg-white relative z-20">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-lg md:text-xl font-black text-[#081621] uppercase tracking-tighter leading-tight font-headline">
                      {baseService.title}
                    </h1>
                    
                    <div className="flex items-center gap-2 py-3 border-y border-gray-50">
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-50/50 px-2 py-1.5 rounded-lg border border-amber-100/50">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[8px] font-black">{baseService.rating || '5.0'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50/50 px-2 py-1.5 rounded-lg border border-blue-100/50">
                        <Clock size={12} />
                        <span className="text-[8px] font-black uppercase">{baseService.duration || 'Flex'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50/50 px-2 py-1.5 rounded-lg border border-emerald-100/50">
                        <Users size={12} />
                        <span className="text-[8px] font-black uppercase">{baseService.teamSize || 'Pro'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Total Price</p>
                        <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {pricingLogic === 'quantity' && (
                          <div className="flex items-center bg-white rounded-xl overflow-hidden h-9 border-2 border-gray-100 shadow-sm">
                            <button onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))} className="px-2 h-full hover:bg-gray-50 text-gray-400"><Minus size={10} /></button>
                            <span className="px-2 font-black text-xs text-[#081621] min-w-[20px] text-center">{mainQuantity}</span>
                            <button onClick={() => setMainQuantity(mainQuantity + 1)} className="px-2 h-full hover:bg-gray-50 text-gray-400"><Plus size={10} /></button>
                          </div>
                        )}

                        {pricingLogic === 'sqft' && baseService.sqftOptions?.length && (
                          <Select value={selectedSqftId || '0'} onValueChange={setSelectedSqftId}>
                            <SelectTrigger className="h-9 w-24 bg-white border-2 border-gray-100 rounded-xl text-[8px] font-black uppercase">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {baseService.sqftOptions.map((opt: any, idx: number) => (
                                <SelectItem key={idx} value={idx.toString()} className="text-[9px] font-black uppercase">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={handleContinue} 
                      disabled={!baseService.isBookingEnabled}
                      className="hidden lg:flex w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-3 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white"
                    >
                      {baseService.bookingButtonText || 'Confirm Booking'} <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add-ons - Span 4 */}
              <div className="lg:col-span-4 p-4 md:p-6 lg:p-8 flex flex-col gap-4 bg-gray-50/20">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Add-on Services</h3>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Selected items will sync with cart</p>
                    </div>
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Zap size={14} fill="currentColor" /></div>
                  </div>

                  <div className="space-y-2 max-h-[450px] overflow-y-auto no-scrollbar pr-1">
                    {addOnOptions?.length ? addOnOptions.map((addon) => {
                      const qty = addOnsQty[addon.id] || 0;
                      return (
                        <div 
                          key={addon.id}
                          className={cn(
                            "p-2 rounded-xl border transition-all flex items-center justify-between bg-white group hover:shadow-md",
                            qty > 0 ? "border-primary ring-1 ring-primary/10 bg-primary/5" : "border-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-50 shrink-0 bg-gray-50">
                              {addon.imageUrl ? <Image src={addon.imageUrl} alt="+" fill className="object-cover" unoptimized /> : <Plus size={12} className="m-auto text-gray-300" />}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-[9px] font-black text-gray-900 uppercase truncate leading-none">{addon.name}</h5>
                              <p className="text-[10px] font-black text-primary mt-1">৳{addon.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center bg-gray-50 rounded-lg px-1.5 py-1 border border-gray-100 shrink-0">
                            <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: Math.max(0, (p[addon.id] || 0) - 1)}))} className="p-1 text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                            <span className="text-[10px] font-black text-[#081621] min-w-[20px] text-center">{qty}</span>
                            <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: (p[addon.id] || 0) + 1}))} className="p-1 text-gray-400 hover:text-emerald-500"><Plus size={12}/></button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-16 text-center opacity-20">
                        <LayoutGrid size={24} className="mx-auto mb-2" />
                        <p className="text-[8px] font-black uppercase tracking-widest">No add-ons</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </section>

        {/* BOTTOM CONTENT */}
        <section className="container mx-auto px-4 max-w-7xl mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 md:p-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                  Service Description
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium">
                  {baseService.description}
                </p>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {baseService.included?.length > 0 && (
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2"><CheckCircle2 size={16}/> What's Included</h4>
                    <div className="space-y-3">
                      {baseService.included.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-xs font-bold text-gray-600">
                          <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {baseService.notIncluded?.length > 0 && (
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-6 flex items-center gap-2"><XCircle size={16}/> Not Included</h4>
                    <div className="space-y-3">
                      {baseService.notIncluded.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-xs font-bold text-gray-400">
                          <X size={14} className="text-red-400 mt-0.5 shrink-0" /> {item}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] px-4 flex items-center gap-2">
                <Sparkles size={20} className="text-primary" /> Service Benefits
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {baseService.features?.map((f: any, i: number) => (
                  <Card key={i} className="border-none shadow-md rounded-[2rem] bg-white p-6 flex gap-4 items-start hover:scale-[1.02] transition-all">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Zap size={20} fill="currentColor" /></div>
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-[10px] text-primary">{f.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE STICKY BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 h-20 px-4 flex items-center justify-between gap-4 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] pb-safe-offset-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Payable</span>
            <span className="text-2xl font-black text-primary tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
          </div>
          <Button 
            onClick={handleContinue} 
            disabled={!baseService.isBookingEnabled} 
            className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            {baseService.bookingButtonText || 'Confirm Booking'}
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}
