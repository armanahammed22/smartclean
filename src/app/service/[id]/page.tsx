
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
  Quote
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

  // Data Fetching
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

  // Calculations
  const pricingLogic = baseService?.pricingType || 'fixed';
  const selectedSlab = pricingLogic === 'sqft' && selectedSqftId !== null ? baseService?.sqftOptions?.[parseInt(selectedSqftId)] : null;
  
  const basePriceValue = useMemo(() => {
    if (!baseService) return 0;
    if (pricingLogic === 'fixed') return baseService.basePrice || 0;
    if (pricingLogic === 'sqft') return selectedSlab?.price || 0;
    return (baseService.basePrice || 0) * mainQuantity;
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
      slab: pricingLogic === 'sqft' ? selectedSlab?.label : null
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
          <Card className="border-none shadow-2xl hover:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] transition-shadow duration-700 rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              
              {/* Media Gallery - Span 5 (Large Visual) */}
              <div className="lg:col-span-5 p-2 md:p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-4">
                <div className="relative aspect-square w-full flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden group">
                  {baseService.imageUrl ? (
                    <Image src={baseService.imageUrl} alt={baseService.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                  ) : (
                    <Wrench size={80} className="text-gray-200" />
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-3 py-1 rounded-sm shadow-2xl">Verified Quality</Badge>
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

              {/* Booking Info - Span 3 (Wider for better visibility) */}
              <div className="lg:col-span-3 p-4 md:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-6 bg-white relative z-20">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h1 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tighter leading-tight font-headline">
                      {baseService.title}
                    </h1>
                    
                    <div className="flex items-center justify-between gap-2 py-4 border-y border-gray-50">
                      <div className="flex flex-col items-center gap-1 flex-1 text-amber-500 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50 transition-transform hover:scale-105">
                        <Star size={16} fill="currentColor" />
                        <span className="text-[9px] font-black">{baseService.rating || '5.0'}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 text-blue-600 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 transition-transform hover:scale-105">
                        <Clock size={16} />
                        <span className="text-[9px] font-black uppercase">{baseService.duration || 'Flex'}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 text-emerald-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 transition-transform hover:scale-105">
                        <Users size={16} />
                        <span className="text-[9px] font-black uppercase">{baseService.teamSize || 'Pro'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-primary/5 border-2 border-primary/10 p-6 rounded-3xl relative overflow-hidden group text-center shadow-inner">
                      <div className="space-y-1 relative z-10">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Payable Amount</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:rotate-12 transition-transform">
                        <Zap size={80} fill="currentColor" />
                      </div>
                    </div>

                    {pricingLogic === 'quantity' && (
                      <div className="flex flex-col gap-3">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Select Units</Label>
                        <div className="flex items-center justify-center bg-gray-100 rounded-2xl overflow-hidden h-12 border-2 border-gray-200 shadow-inner">
                          <button onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))} className="px-5 h-full hover:bg-gray-200 text-gray-500 transition-colors"><Minus size={14} /></button>
                          <span className="px-4 font-black text-sm text-[#081621] min-w-[40px] text-center">{mainQuantity}</span>
                          <button onClick={() => setMainQuantity(mainQuantity + 1)} className="px-5 h-full hover:bg-gray-200 text-gray-500 transition-colors"><Plus size={14} /></button>
                        </div>
                      </div>
                    )}

                    {pricingLogic === 'sqft' && baseService.sqftOptions?.length && (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center block">Service Area (Sqft)</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {baseService.sqftOptions.map((opt: any, idx: number) => (
                            <div 
                              key={idx}
                              onClick={() => setSelectedSqftId(idx.toString())}
                              className={cn(
                                "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                selectedSqftId === idx.toString() ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                              )}
                            >
                              <span className="text-[10px] font-black uppercase truncate text-gray-700">{opt.label}</span>
                              <span className="text-xs font-black text-primary">৳{opt.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleContinue} 
                      disabled={!baseService.isBookingEnabled}
                      className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30 gap-3 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white relative z-30"
                    >
                      {baseService.bookingButtonText || 'Confirm Booking'} <ArrowRight size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add-ons - Span 4 */}
              <div className="lg:col-span-4 p-4 md:p-6 lg:p-8 flex flex-col gap-4 bg-gray-50/30">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-primary">Extra Services</h3>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Maximize your result</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl text-primary animate-bounce"><Zap size={16} fill="currentColor" /></div>
                  </div>

                  <div className="space-y-2 max-h-[550px] overflow-y-auto no-scrollbar pr-1">
                    {addOnOptions?.length ? addOnOptions.map((addon) => {
                      const qty = addOnsQty[addon.id] || 0;
                      return (
                        <div 
                          key={addon.id}
                          className={cn(
                            "p-2.5 rounded-2xl border transition-all flex items-center justify-between bg-white group hover:shadow-lg",
                            qty > 0 ? "border-primary ring-2 ring-primary/10 bg-primary/5" : "border-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-50 shrink-0 bg-gray-50 shadow-sm">
                              {addon.imageUrl ? <Image src={addon.imageUrl} alt="+" fill className="object-cover" unoptimized /> : <Plus size={14} className="m-auto text-gray-300" />}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-[10px] font-black text-gray-900 uppercase truncate leading-none group-hover:text-primary transition-colors">{addon.name}</h5>
                              <p className="text-[11px] font-black text-primary mt-1">৳{addon.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center bg-white rounded-xl px-2 py-1.5 border-2 border-gray-100 shrink-0 shadow-sm">
                            <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: Math.max(0, (p[addon.id] || 0) - 1)}))} className="p-1 text-gray-400 hover:text-red-500 transition-all"><Minus size={14}/></button>
                            <span className="text-[11px] font-black text-[#081621] min-w-[25px] text-center">{qty}</span>
                            <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: (p[addon.id] || 0) + 1}))} className="p-1 text-gray-400 hover:text-emerald-500 transition-all"><Plus size={14}/></button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-20 text-center space-y-3 opacity-20">
                        <LayoutGrid size={32} className="mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No add-ons available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </section>

        {/* BOTTOM CONTENT: DESCRIPTION & REVIEWS */}
        <section className="container mx-auto px-4 max-w-7xl mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 md:p-12 space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-primary border-b border-gray-100 pb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full" /> Full Service Blueprint
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium">
                  {baseService.description}
                </p>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {baseService.included?.length > 0 && (
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><CheckCircle2 size={16}/> Standard Inclusions</h4>
                    <div className="space-y-3">
                      {baseService.included.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-xs font-bold text-gray-600 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
                          <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {baseService.notIncluded?.length > 0 && (
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2"><XCircle size={16}/> Service Exclusions</h4>
                    <div className="space-y-3">
                      {baseService.notIncluded.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-xs font-bold text-gray-400 bg-red-50/30 p-3 rounded-xl border border-red-100/50">
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
                <Sparkles size={20} className="text-primary" /> Service Ethics
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {baseService.features?.map((f: any, i: number) => (
                  <Card key={i} className="border-none shadow-md rounded-[2rem] bg-white p-6 flex gap-4 items-start group hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-[11px] text-primary">{f.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {baseService.reviewsEnabled && (
          <section className="container mx-auto px-4 py-16 max-w-7xl">
            <div className="bg-[#081621] rounded-[3rem] p-10 md:p-20 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 pointer-events-none"><Quote size={250} fill="white" /></div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 relative z-10">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Trust Matrix</h2>
                  <p className="text-primary font-black uppercase tracking-[0.3em] text-xs">Real-time Verified Performance</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex items-center gap-6 shadow-2xl">
                  <div className="text-center">
                    <p className="text-4xl font-black text-primary leading-none">4.9</p>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-2">Overall Score</p>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="flex gap-1 text-amber-400">
                    {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                </div>
              </div>

              {reviews?.length ? (
                <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4500 })]} className="w-full relative z-10">
                  <CarouselContent className="-ml-6">
                    {reviews.map((rev) => (
                      <CarouselItem key={rev.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3">
                        <Card className="border-none bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 h-full border border-white/5 space-y-6 hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex text-amber-400 gap-0.5">
                              {[...Array(rev.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                            </div>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{format(new Date(rev.createdAt), 'MMM dd')}</span>
                          </div>
                          <p className="text-white/90 text-sm font-medium leading-relaxed italic">"{rev.text}"</p>
                          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-sm uppercase border border-primary/20 shadow-inner">{rev.userName[0]}</div>
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">{rev.userName}</p>
                              <Badge className="bg-green-500/20 text-green-400 border-none text-[7px] font-black uppercase h-4 px-2 mt-1">Verified Client</Badge>
                            </div>
                          </div>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : (
                <div className="py-24 text-center opacity-20 relative z-10">
                  <MessageSquare size={64} className="mx-auto text-white mb-4" />
                  <p className="text-white font-black uppercase tracking-widest text-xs">Waiting for your feedback</p>
                </div>
              )}

              {user && canSubmitReview && (
                <div className="mt-16 max-w-2xl mx-auto bg-white rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 animate-in slide-in-from-bottom-10 duration-700">
                  <div className="p-8 md:p-12 space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-[#081621] uppercase tracking-tight">Share Your Opinion</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Contribute to our community</p>
                    </div>
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      <div className="flex justify-center gap-3">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewRating(star)} className="transition-transform active:scale-75 hover:scale-110">
                            <Star size={32} fill={star <= reviewRating ? "#F59E0B" : "none"} className={star <= reviewRating ? "text-[#F59E0B]" : "text-gray-200"} />
                          </button>
                        ))}
                      </div>
                      <Textarea 
                        value={reviewText} 
                        onChange={e => setReviewText(e.target.value)} 
                        placeholder="Write your honest review here..." 
                        className="min-h-[120px] bg-gray-50 border-none rounded-[1.5rem] p-6 text-sm font-medium focus:ring-primary/20 shadow-inner"
                        required
                      />
                      <Button type="submit" disabled={isSubmittingReview} className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/20">
                        {isSubmittingReview ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />} 
                        Post Review
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 📱 Mobile Sticky Action Bar */}
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
