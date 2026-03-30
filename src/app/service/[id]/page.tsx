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
  Info,
  Calendar,
  Sparkles,
  ClipboardList,
  Shield,
  BadgeCheck,
  RefreshCcw,
  Camera,
  MessageSquare,
  LayoutGrid,
  Send,
  User as UserIcon,
  LogIn,
  Eye,
  ShoppingCart,
  HelpCircle,
  PlayCircle,
  XCircle,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Autoplay from "embla-carousel-autoplay";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from '@/components/ui/carousel';

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

  // Review System Guards
  const completedBookingQuery = useMemoFirebase(() => 
    (db && user && targetId) ? query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid),
      where('serviceId', '==', targetId),
      where('status', '==', 'Completed'),
      limit(1)
    ) : null, [db, user, targetId]);
  const { data: userCompletedBookings } = useCollection(completedBookingQuery);
  const canSubmitReview = !!userCompletedBookings?.length;

  const addOnsQuery = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', targetId), where('status', '==', 'Active'), where('isAddOnEnabled', '==', true));
  }, [db, targetId]);
  const { data: addOnOptions } = useCollection(addOnsQuery);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    return query(collection(db, 'services', targetId, 'reviews'), where('status', '==', 'Approved'), orderBy('createdAt', 'desc'));
  }, [db, targetId]);
  const { data: reviews } = useCollection(reviewsQuery);

  useEffect(() => {
    if (baseService?.pricingType === 'sqft' && baseService.sqftOptions?.length) {
      setSelectedSqftId('0');
    }
  }, [baseService]);

  const pricingLogic = baseService?.pricingType || 'fixed';
  const selectedSlab = pricingLogic === 'sqft' && selectedSqftId !== null ? baseService?.sqftOptions?.[parseInt(selectedSqftId)] : null;
  
  const basePrice = useMemo(() => {
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
  const totalPrice = basePrice + addOnsTotal + platformFee;

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
      title: baseService.title,
      basePrice: totalPrice,
      imageUrl: baseService.imageUrl || '',
      type: 'service',
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

  const beforeAfterImages = baseService.beforeAfterImages || [];

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F9FAFB] min-h-screen pb-24">
        
        <section className="container mx-auto px-0 md:px-4 py-0 md:py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: LEFT - Media & Proofs */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <div className="relative aspect-square w-full flex items-center justify-center bg-white group">
                  {baseService.imageUrl ? (
                    <Image src={baseService.imageUrl} alt={baseService.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                  ) : (
                    <Wrench size={80} className="text-gray-100" />
                  )}
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-[#081621] text-primary border-none text-[9px] font-black uppercase px-4 py-1 rounded-sm shadow-2xl">Verified Quality</Badge>
                  </div>
                </div>
              </Card>

              {beforeAfterImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#081621]">Real Job Proofs</h3>
                    <Badge variant="outline" className="text-[8px] font-bold border-gray-200">Before & After</Badge>
                  </div>
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                      {beforeAfterImages.map((img: any, i: number) => (
                        <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-full">
                          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md">
                            <Image src={img.url} alt={`Work ${i}`} fill className="object-cover" unoptimized />
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                              <span className="text-[8px] font-black text-white uppercase tracking-widest">{img.tag}</span>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </div>

            {/* COLUMN 2: MIDDLE - Primary Info */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white p-8 md:p-10 space-y-8">
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter leading-[0.9] font-headline">
                    {baseService.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 py-2 border-y border-gray-50">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star size={16} fill="currentColor" />
                      <span className="text-xs font-black">{baseService.rating || '5.0'}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase">{baseService.duration || 'Flexible'}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Users size={16} />
                      <span className="text-[10px] font-black uppercase">{baseService.teamSize || 'Professional'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#081621] text-white p-8 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><ShoppingCart size={80} /></div>
                    <div className="space-y-1 relative z-10">
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Total Value</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">৳{totalPrice.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-white/40 uppercase">VAT INC</span>
                      </div>
                    </div>
                    {pricingLogic === 'quantity' && (
                      <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl overflow-hidden h-12 relative z-10 border border-white/5">
                        <button onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))} className="px-4 hover:bg-white/10 transition-colors"><Minus size={16} /></button>
                        <span className="px-4 font-black text-sm text-white min-w-[40px] text-center">{mainQuantity}</span>
                        <button onClick={() => setMainQuantity(mainQuantity + 1)} className="px-4 hover:bg-white/10 transition-colors"><Plus size={16} /></button>
                      </div>
                    )}
                  </div>

                  {pricingLogic === 'sqft' && baseService.sqftOptions?.length && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-[10px] font-black uppercase text-[#081621] tracking-[0.2em] ml-1">Area Size (Square Feet)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {baseService.sqftOptions.map((opt: any, idx: number) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedSqftId(idx.toString())}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
                              selectedSqftId === idx.toString() ? "border-primary bg-primary/5 shadow-md" : "border-gray-50 bg-gray-50/50 hover:border-gray-200"
                            )}
                          >
                            <span className="text-xs font-bold uppercase tracking-tight">{opt.label}</span>
                            <span className="text-sm font-black text-primary">৳{opt.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-50 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Service Base</span>
                      <span className="text-gray-900">৳{basePrice.toLocaleString()}</span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between text-[10px] font-black uppercase text-blue-600">
                        <span>Extras & Add-ons</span>
                        <span>+৳{addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Service Charge</span>
                      <span>৳{platformFee}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleContinue} 
                    disabled={!baseService.isBookingEnabled}
                    className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 gap-2 transition-all active:scale-95"
                  >
                    {baseService.bookingButtonText || 'Proceed to Checkout'} <ArrowRight size={18} />
                  </Button>
                </div>
              </Card>

              {/* DESCRIPTION & CHECKLISTS */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#081621] border-b pb-2">Full Description</h3>
                  <p className="text-sm text-gray-600 leading-loose font-medium">
                    {baseService.description}
                  </p>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {baseService.included?.length > 0 && (
                    <Card className="border-none shadow-sm rounded-3xl bg-white p-6 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><CheckCircle2 size={14}/> Included</h4>
                      <div className="space-y-2">
                        {baseService.included.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-xs font-bold text-gray-600">
                            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /> {item}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {baseService.notIncluded?.length > 0 && (
                    <Card className="border-none shadow-sm rounded-3xl bg-white p-6 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2"><XCircle size={14}/> Not Included</h4>
                      <div className="space-y-2">
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
            </div>

            {/* COLUMN 3: RIGHT - Add-ons */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white p-8 space-y-8 sticky top-24">
                <div className="border-b pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#081621]">Boost Service</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Optional Customization</p>
                  </div>
                  <Zap size={18} className="text-primary" fill="currentColor" />
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
                  {addOnOptions?.length ? addOnOptions.map((addon) => {
                    const qty = addOnsQty[addon.id] || 0;
                    return (
                      <div 
                        key={addon.id}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all group flex flex-col gap-3",
                          qty > 0 ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50 hover:border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border shrink-0 bg-white">
                            {addon.imageUrl ? <Image src={addon.imageUrl} alt="+" fill className="object-cover" unoptimized /> : <Plus size={16} className="m-auto text-gray-300" />}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-black text-gray-900 uppercase truncate leading-none mb-1">{addon.name}</h5>
                            <p className="text-[10px] font-black text-primary tracking-tighter">+৳{addon.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100/50">
                          <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: Math.max(0, (p[addon.id] || 0) - 1)}))} className="text-red-400 hover:text-red-600 transition-colors"><Minus size={14}/></button>
                          <span className="text-[11px] font-black text-gray-900">{qty}</span>
                          <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: (p[addon.id] || 0) + 1}))} className="text-emerald-500 hover:text-emerald-700 transition-colors"><Plus size={14}/></button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-10 text-center space-y-3 opacity-20">
                      <LayoutGrid size={32} className="mx-auto" />
                      <p className="text-[9px] font-black uppercase tracking-widest">No Add-ons</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

          </div>
        </section>

        {/* WHY CHOOSE US - 4 CARDS */}
        {baseService.features?.length > 0 && (
          <section className="container mx-auto px-4 py-16 max-w-7xl">
            <div className="text-center space-y-2 mb-12">
              <Badge className="bg-primary text-white border-none text-[9px] font-black uppercase px-4 py-1 rounded-full">Trust Metrics</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter">Why Choose Smart Clean?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {baseService.features.map((f: any, i: number) => (
                <div key={i} className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                  <div className="p-4 bg-primary/10 text-primary w-fit rounded-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <h4 className="text-xl font-black text-[#081621] uppercase tracking-tight">{f.title}</h4>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REVIEWS AUTO SLIDER */}
        {baseService.reviewsEnabled && (
          <section className="container mx-auto px-4 py-16 max-w-7xl">
            <div className="bg-[#081621] rounded-[3rem] p-10 md:p-20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-20 opacity-5 -rotate-12 pointer-events-none"><Quote size={300} fill="white" /></div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 relative z-10">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">Client Voices</h2>
                  <p className="text-white/40 font-black uppercase tracking-[0.2em] text-xs">Certified satisfaction from completed jobs</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-black text-primary leading-none">4.9</p>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">Average</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex gap-0.5 text-amber-400">
                    {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                </div>
              </div>

              {reviews?.length ? (
                <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4000 })]} className="w-full relative z-10">
                  <CarouselContent className="-ml-6">
                    {reviews.map((rev) => (
                      <CarouselItem key={rev.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3">
                        <Card className="border-none bg-white/5 backdrop-blur-sm rounded-[2rem] p-8 h-full border border-white/5 space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="flex text-amber-400 gap-0.5">
                              {[...Array(rev.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase font-mono">{format(new Date(rev.createdAt), 'MMM dd')}</span>
                          </div>
                          <p className="text-white/80 text-sm font-medium leading-loose italic">"{rev.text}"</p>
                          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-white text-xs uppercase">{rev.userName[0]}</div>
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">{rev.userName}</p>
                              <Badge className="bg-green-500/20 text-green-400 border-none text-[7px] font-black uppercase h-4 px-1.5">Verified Booking</Badge>
                            </div>
                          </div>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : (
                <div className="py-20 text-center opacity-20 relative z-10">
                  <MessageSquare size={64} className="mx-auto text-white mb-4" />
                  <p className="text-white font-black uppercase tracking-widest text-xs">Waiting for first review...</p>
                </div>
              )}

              {/* REVIEW FORM SUBMISSION */}
              {user && (
                <div className="mt-20 max-w-2xl mx-auto bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom-10">
                  {canSubmitReview ? (
                    <div className="p-8 md:p-12 space-y-8">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-[#081621] uppercase">Rate Your Experience</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Share feedback about this completed job</p>
                      </div>
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div className="flex justify-center gap-3">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} type="button" onClick={() => setReviewRating(star)} className="transition-transform active:scale-90">
                              <Star size={32} fill={star <= reviewRating ? "#F59E0B" : "none"} className={star <= reviewRating ? "text-[#F59E0B]" : "text-gray-200"} />
                            </button>
                          ))}
                        </div>
                        <Textarea 
                          value={reviewText} 
                          onChange={e => setReviewText(e.target.value)} 
                          placeholder="How was the cleaning quality?" 
                          className="min-h-[120px] bg-gray-50 border-none rounded-2xl p-6 font-medium"
                          required
                        />
                        <Button type="submit" disabled={isSubmittingReview} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight gap-2 shadow-xl">
                          {isSubmittingReview ? <Loader2 className="animate-spin" /> : <Send size={18} />} 
                          Post My Review
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-12 text-center space-y-6">
                      <div className="mx-auto w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center border-4 border-dashed"><Star size={40} /></div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase text-gray-900">Review Access Restricted</h3>
                        <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">You can only review services that you have booked and successfully completed.</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">Certified Review Policy</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* MOBILE STICKY BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t p-4 pb-safe-offset-4 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Estimated Total</span>
            <span className="text-2xl font-black text-[#081621] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
          </div>
          <Button onClick={handleContinue} disabled={!baseService.isBookingEnabled} className="flex-1 h-14 rounded-2xl bg-[#081621] text-white font-black text-xs uppercase tracking-widest shadow-xl">
            {baseService.bookingButtonText || 'Book Now'}
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}

function Autoplay(arg0: { delay: number; }): import("embla-carousel-react").EmblaPluginType {
  throw new Error('Function not implemented.');
}
