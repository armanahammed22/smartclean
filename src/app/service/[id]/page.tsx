
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
  PlayCircle
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [addOnsQty, setAddOnsQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  
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

  const subServiceRef = useMemoFirebase(() => (db && slugOrId) ? doc(db, 'sub_services', slugOrId as string) : null, [db, slugOrId]);
  const { data: idSubService, isLoading: subLoading } = useDoc(subServiceRef);

  const baseService = useMemo(() => {
    if (slugServices && slugServices.length > 0) return slugServices[0];
    return idService || idSubService || null;
  }, [slugServices, idService, idSubService]);

  const targetId = useMemo(() => baseService?.id || null, [baseService]);
  const isMain = useMemo(() => !!(slugServices?.length || idService), [slugServices, idService]);

  const packagesQuery = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    const collPath = isMain ? `services/${targetId}/packages` : `sub_services/${targetId}/packages`;
    return query(collection(db, collPath), orderBy('price', 'asc'));
  }, [db, targetId, isMain]);
  const { data: packages } = useCollection(packagesQuery);

  const addOnsQuery = useMemoFirebase(() => {
    if (!db || !targetId || !isMain) return null;
    return query(collection(db, targetId ? (isMain ? 'sub_services' : 'sub_services') : 'sub_services'), where('mainServiceId', '==', targetId), where('status', '==', 'Active'));
  }, [db, targetId, isMain]);
  const { data: relatedSubs } = useCollection(addOnsQuery);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !targetId) return null;
    const collPath = isMain ? `services/${targetId}/reviews` : `sub_services/${targetId}/reviews`;
    return query(collection(db, collPath), orderBy('createdAt', 'desc'));
  }, [db, targetId, isMain]);
  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  useEffect(() => {
    if (packages?.length) {
      const def = packages.find(p => p.isRecommended) || packages[0];
      setSelectedPackageId(def.id);
    }
  }, [packages]);

  const addOnOptions = useMemo(() => {
    if (!relatedSubs) return [];
    return relatedSubs.filter(sub => sub.isAddOnEnabled);
  }, [relatedSubs]);

  const pricingLogic = baseService?.pricingType || 'quantity';
  const activePackage = packages?.find(p => p.id === selectedPackageId);
  
  const basePrice = pricingLogic === 'sqft' 
    ? (activePackage?.price || 0) 
    : (baseService?.basePrice || baseService?.price || 0) * mainQuantity;

  const addOnsTotal = addOnOptions.reduce((acc, a) => acc + (a.price * (addOnsQty[a.id] || 0)), 0);
  const platformFee = 50;
  const totalPrice = basePrice + addOnsTotal + platformFee;

  const handleContinue = () => {
    if (!baseService) return;
    
    const selectedAddOns = addOnOptions
      .filter(a => (addOnsQty[a.id] || 0) > 0)
      .map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: addOnsQty[a.id]
      }));

    const cartItem = {
      ...baseService,
      title: baseService.title || baseService.name,
      basePrice: totalPrice,
      imageUrl: baseService.imageUrl || '',
      type: 'service',
      selectedAddOns: selectedAddOns,
      notes: notes,
      slab: pricingLogic === 'sqft' ? activePackage?.name : null
    };

    addToCart(cartItem as any, 1, false);
    setCheckoutOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !targetId) return;
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      const collPath = isMain ? `services/${targetId}/reviews` : `sub_services/${targetId}/reviews`;
      await addDoc(collection(db, collPath), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        rating: reviewRating,
        text: reviewText,
        createdAt: new Date().toISOString(),
        status: 'Approved'
      });
      setReviewText('');
      setReviewRating(5);
      toast({ title: t('op_success') });
    } catch (e) {
      toast({ variant: "destructive", title: t('something_wrong') });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!mounted || (slugLoading && idLoading && subLoading)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!baseService) return <div className="p-20 text-center uppercase font-black text-gray-300">{t('no_data_found')}</div>;

  const workProofImages = baseService.workProofImages || [
    "https://picsum.photos/seed/wp1/800/600",
    "https://picsum.photos/seed/wp2/800/600",
    "https://picsum.photos/seed/wp3/800/600",
    "https://picsum.photos/seed/wp4/800/600",
    "https://picsum.photos/seed/wp5/800/600"
  ];

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-white min-h-screen">
        <section className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-7xl">
          <div className="bg-white border border-gray-100 flex flex-col lg:grid lg:grid-cols-12 relative overflow-visible shadow-sm lg:rounded-2xl">
            
            <div className="lg:col-span-5 p-6 md:p-10 space-y-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative aspect-video md:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border shadow-inner">
                {baseService.imageUrl ? (
                  <Image src={baseService.imageUrl} alt="Service" fill className="object-cover" unoptimized />
                ) : (
                  <Wrench size={48} className="text-gray-200" />
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-[#022C22] text-[#D4AF37] border-none text-[9px] font-black uppercase px-3 py-1 rounded-sm shadow-xl">{t('premium_badge')}</Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-2xl md:text-4xl font-black text-[#081621] uppercase tracking-tight font-headline leading-none">
                    {baseService.title || baseService.name}
                  </h1>
                  
                  <div className="flex items-center gap-4 py-1">
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

                <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-4xl font-black text-[#022C22]">৳{basePrice.toLocaleString()}</span>
                    {pricingLogic === 'sqft' && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('price_from')}</span>}
                  </div>
                  
                  {pricingLogic === 'quantity' && (
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-12">
                      <button onClick={() => setMainQuantity(Math.max(1, mainQuantity - 1))} className="px-4 hover:bg-red-50 text-red-500 transition-colors border-r"><Minus size={16} /></button>
                      <span className="px-6 font-black text-sm text-gray-900 min-w-[50px] text-center">{mainQuantity}</span>
                      <button onClick={() => setMainQuantity(mainQuantity + 1)} className="px-4 hover:bg-green-50 text-emerald-600 transition-colors border-l"><Plus size={16} /></button>
                    </div>
                  )}
                </div>

                <div className="space-y-6 pt-2">
                  {pricingLogic === 'sqft' && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Select Area size (Sqft)</Label>
                      <Select value={selectedPackageId || ''} onValueChange={setSelectedPackageId}>
                        <SelectTrigger className="h-14 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold focus:ring-[#D4AF37] focus:border-[#D4AF37]">
                          <SelectValue placeholder="Choose your area slab" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {packages?.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id} className="font-bold uppercase text-[10px]">
                              {pkg.name} — ৳{pkg.price.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 p-6 md:p-8 space-y-8 bg-gray-50/20 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#081621]">Enhance Service</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Optional additions</p>
                </div>
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-none font-black text-[8px] uppercase">Optional</Badge>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {addOnOptions.map((addon) => {
                  const qty = addOnsQty[addon.id] || 0;
                  return (
                    <div 
                      key={addon.id}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 bg-white",
                        qty > 0 ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-md" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                          {addon.imageUrl ? <Image src={addon.imageUrl} alt="Addon" fill className="object-cover" unoptimized /> : <Zap size={20} className="text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-gray-900 uppercase truncate leading-none mb-1">{addon.name}</h5>
                          <p className="text-[11px] font-black text-[#D4AF37]">৳{addon.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100/50">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Qty</span>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm h-9">
                          <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: Math.max(0, (p[addon.id] || 0) - 1)}))} className="px-2 hover:bg-red-50 text-red-500 transition-colors border-r"><Minus size={14} /></button>
                          <span className="w-8 text-center text-[11px] font-black text-gray-900">{qty}</span>
                          <button onClick={() => setAddOnsQty(p => ({...p, [addon.id]: (p[addon.id] || 0) + 1}))} className="px-2 hover:bg-green-50 text-emerald-600 transition-colors border-l"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2"><ClipboardList size={14} /> Technician Note</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions..." className="min-h-[100px] bg-white border-gray-200 rounded-2xl p-4 text-xs font-medium" />
              </div>
            </div>

            <div className="lg:col-span-3 hidden lg:block">
              <div className="p-8 flex flex-col bg-white sticky top-24 h-full min-h-[600px]">
                <div className="space-y-8 h-full flex flex-col">
                  <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022C22]">Live Summary</h3>
                    <ShoppingCart size={16} className="text-[#D4AF37]" />
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Base Rate</span>
                      <span className="text-gray-900 font-black">৳{basePrice.toLocaleString()}</span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-blue-600 uppercase">
                        <span>Extras</span>
                        <span className="font-black">+৳{addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Service Fee</span>
                      <span className="text-gray-900 font-black">৳{platformFee}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t-2 border-dashed border-gray-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Balance</span>
                    <span className="text-4xl font-black text-[#022C22] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                  </div>

                  <Button onClick={handleContinue} className="w-full h-16 rounded-2xl bg-[#022C22] hover:bg-[#064E3B] text-[#D4AF37] font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-950/20 gap-2 transition-all mt-6">
                    {t('proceed_to_checkout')} <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* WORK PROOF & FAQ SECTION */}
        <section className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            
            {/* LEFT: WORK PROOF GALLERY */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tighter italic flex items-center gap-3">
                  <Camera className="text-primary" size={24} /> {t('results_gallery')}
                </h2>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Certified quality results from recent jobs</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-gray-50 border shadow-inner">
                  <Image src={workProofImages[0]} alt="Featured Result" fill className="object-cover" unoptimized />
                  <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Main Result</span>
                  </div>
                </div>

                <Carousel 
                  opts={{ align: "start", loop: true }} 
                  plugins={[Autoplay({ delay: 3000 })]}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {workProofImages.slice(1).map((img, i) => (
                      <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-1/3">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all group">
                          <Image src={img} alt={`Result ${i+1}`} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={20} className="text-white" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>

            {/* RIGHT: FAQ OR HOW TO BOOK */}
            <div className="bg-gray-50/50 p-8 md:p-12 rounded-[3rem] border border-gray-100 flex flex-col justify-center">
              {baseService.showFaq ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">Support Intel</Badge>
                    <h2 className="text-3xl font-black text-[#081621] uppercase tracking-tight">Smarter FAQ</h2>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {(baseService.faqList || [
                      { q: "How long does deep cleaning take?", a: "Standard deep cleaning usually takes 4-6 hours depending on the size of your space." },
                      { q: "Do I need to provide cleaning supplies?", a: "No, our professionals bring all necessary industrial-grade equipment and eco-friendly supplies." },
                      { q: "Is the price fixed?", a: "The base price is fixed, but it may vary if you select additional add-ons or larger area slabs." }
                    ]).map((faq, i) => (
                      <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white rounded-2xl px-6 shadow-sm overflow-hidden">
                        <AccordionTrigger className="hover:no-underline py-5 text-sm font-black uppercase tracking-tight text-[#081621]">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-gray-500 font-medium leading-relaxed pb-6">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="space-y-2 text-center lg:text-left">
                    <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase tracking-widest">Process Flow</Badge>
                    <h2 className="text-3xl font-black text-[#081621] uppercase tracking-tight">How to Book?</h2>
                  </div>
                  <div className="space-y-8">
                    {(baseService.howToBook || [
                      "Select your preferred service and area slab above.",
                      "Click on 'Proceed to Checkout' to review your items.",
                      "Enter your address and preferred schedule date.",
                      "Confirm your booking and our team will contact you instantly."
                    ]).map((step, i) => (
                      <div key={i} className="flex gap-6 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-white border-2 border-primary text-primary flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                            {i + 1}
                          </div>
                          {i < 3 && <div className="w-0.5 h-full bg-gray-100 my-2" />}
                        </div>
                        <div className="pt-1 space-y-1">
                          <p className="text-sm font-bold text-gray-800 leading-snug">{step}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Action Step</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full h-14 rounded-2xl bg-[#081621] text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl mt-4">
                    Ready to Start? <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              )}
            </div>

          </div>
        </section>

        <section className="container mx-auto px-4 py-8 max-w-7xl mb-24 lg:mb-12">
          <div className="bg-white lg:rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-8">
              <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tighter leading-none">{t('ratings')}</h2>
              <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center space-y-3">
                <p className="text-5xl font-black text-[#022C22] tracking-tighter">4.9</p>
                <div className="flex justify-center text-[#D4AF37] gap-1">{[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}</div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{reviews?.length || 0} {t('reviews_count')}</p>
              </div>
              {user ? (
                <div className="p-6 bg-[#081621] text-white rounded-2xl space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><MessageSquare size={18} /> {t('write_review')}</h4>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewRating(star)}>
                        <Star size={20} fill={star <= reviewRating ? "#D4AF37" : "none"} className={star <= reviewRating ? "text-[#D4AF37]" : "text-white/20"} />
                      </button>
                    ))}
                  </div>
                  <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Your experience..." className="bg-white/5 border-white/10 text-white min-h-[80px]" />
                  <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="w-full bg-[#D4AF37] hover:bg-[#B8860B] text-[#022C22] font-black uppercase text-[10px]">{t('submit_review')}</Button>
                </div>
              ) : (
                <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-4">
                  <LogIn size={24} className="mx-auto text-blue-600" />
                  <p className="text-[10px] font-black uppercase text-blue-900">{t('sign_in_to_review')}</p>
                  <Button asChild variant="outline" className="w-full h-10 text-[10px] uppercase font-black"><Link href="/login">{t('login_btn')}</Link></Button>
                </div>
              )}
            </div>
            <div className="lg:col-span-8 space-y-6">
              {reviewsLoading ? <Loader2 className="animate-spin text-primary mx-auto" /> : reviews?.map((rev) => (
                <div key={rev.id} className="p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-[#022C22] border shadow-inner uppercase text-xs">{rev.userName?.[0]}</div>
                      <div>
                        <h5 className="font-black text-gray-900 uppercase text-xs">{rev.userName}</h5>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{mounted && rev.createdAt ? format(new Date(rev.createdAt), 'PP') : '...'}</p>
                      </div>
                    </div>
                    <div className="flex text-[#D4AF37] gap-0.5">{[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed italic border-l-2 border-[#D4AF37]/20 pl-4">"{rev.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Total Payable</span>
            <span className="text-2xl font-black text-[#022C22] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
          </div>
          <Button onClick={handleContinue} className="flex-1 h-16 rounded-2xl bg-[#022C22] text-[#D4AF37] font-black text-sm uppercase tracking-tight shadow-2xl gap-2">
            {t('book_now')} <ArrowRight size={20} />
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}
