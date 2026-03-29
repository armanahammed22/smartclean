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
  ShoppingCart
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ServiceBookingPage() {
  const { id: slugOrId } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const { addToCart, setCheckoutOpen, isCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [addOnsQty, setAddOnsQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [beforeAfterTab, setBeforeAfterTab] = useState('all');
  
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
  const { data: subService, isLoading: subLoading } = useDoc(subServiceRef);

  const baseService = useMemo(() => {
    if (slugServices && slugServices.length > 0) return slugServices[0];
    return idService || subService || null;
  }, [slugServices, idService, subService]);

  const isLoading = slugLoading && idLoading && subLoading;

  const mainId = useMemo(() => baseService?.id || null, [baseService]);
  
  const relatedSubsQuery = useMemoFirebase(() => {
    if (!db || !mainId) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', mainId), where('status', '==', 'Active'));
  }, [db, mainId]);
  const { data: relatedSubs } = useCollection(relatedSubsQuery);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !mainId) return null;
    return query(collection(db, 'services', mainId as string, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, mainId]);
  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  const addOnOptions = useMemo(() => {
    if (!relatedSubs) return [];
    return relatedSubs.filter(sub => sub.id !== mainId && sub.isAddOnEnabled);
  }, [relatedSubs, mainId]);

  const basePrice = baseService?.basePrice || baseService?.price || 0;
  const addOnsTotal = addOnOptions.reduce((acc, a) => acc + (a.price * (addOnsQty[a.id] || 0)), 0);
  const platformFee = 50;
  const totalPrice = basePrice + addOnsTotal + platformFee;

  const updateAddOnQty = (subId: string, delta: number) => {
    setAddOnsQty(prev => {
      const current = prev[subId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const newState = { ...prev };
        delete newState[subId];
        return newState;
      }
      return { ...prev, [subId]: next };
    });
  };

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

    addToCart({
      ...baseService,
      title: baseService.title || baseService.name,
      basePrice: totalPrice,
      imageUrl: baseService.imageUrl || '',
      type: 'service',
      selectedAddOns: selectedAddOns
    } as any, 1, false);
    setCheckoutOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !mainId) return;
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'services', mainId as string, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        rating: reviewRating,
        text: reviewText,
        createdAt: new Date().toISOString(),
        status: 'Approved'
      });
      setReviewText('');
      setReviewRating(5);
      toast({ title: "Review Posted", description: "Thank you for your feedback!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to post review" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!baseService) return <div className="p-20 text-center uppercase font-black text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F2F4F7] min-h-screen">
        
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-100 py-2 hidden md:block">
          <div className="container mx-auto px-4 max-w-7xl">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight size={10} />
              <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
              <ChevronRight size={10} />
              <span className="text-primary truncate max-w-[200px]">{baseService.title || baseService.name}</span>
            </nav>
          </div>
        </div>

        {/* Unified Booking Interface */}
        <section className="container mx-auto px-0 md:px-4 py-0 md:py-4 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-lg border border-gray-100 flex flex-col lg:grid lg:grid-cols-12 relative overflow-hidden">
            
            {/* COLUMN 1: Main Service Content */}
            <div className="lg:col-span-5 p-6 md:p-10 space-y-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative aspect-[16/9] md:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border shadow-inner group">
                {baseService.imageUrl ? (
                  <Image src={baseService.imageUrl} alt="Service" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                ) : (
                  <Wrench size={48} className="text-gray-200" />
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-[#022C22] text-[#D4AF37] border-none text-[9px] font-black uppercase px-3 py-1 rounded-sm shadow-xl">Top Rated Service</Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-2xl md:text-3xl font-black text-[#081621] uppercase tracking-tight font-headline leading-none">
                    {baseService.title || baseService.name}
                  </h1>
                  
                  <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100 whitespace-nowrap">
                      <Star size={14} fill="currentColor" />
                      <span className="text-[10px] font-black">{baseService.rating || '5.0'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{baseService.duration || 'Flexible'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 whitespace-nowrap">
                      <Users size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{baseService.teamSize || 'Pros'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-[#022C22]">৳{basePrice.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Rate</span>
                </div>

                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                    "{baseService.description || "Expert level professional treatment for discerning clients."}"
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Add-on Selection */}
            <div className="lg:col-span-4 p-6 md:p-8 space-y-8 bg-gray-50/20 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#081621]">Enhance Service</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Select multiple units if required</p>
                </div>
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-none font-black text-[8px] uppercase">Optional</Badge>
              </div>

              <div className="space-y-4">
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
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                          {addon.imageUrl ? (
                            <Image src={addon.imageUrl} alt="Addon" fill className="object-cover" unoptimized />
                          ) : (
                            <Zap size={20} className="m-auto text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-gray-900 uppercase truncate tracking-tight leading-none mb-1">{addon.name}</h5>
                          <p className="text-[11px] font-black text-[#D4AF37]">৳{addon.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100/50">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Quantity</span>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <button 
                            onClick={() => updateAddOnQty(addon.id, -1)}
                            className="p-2 hover:bg-red-50 text-red-500 transition-colors border-r"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-xs font-black text-gray-900">{qty}</span>
                          <button 
                            onClick={() => updateAddOnQty(addon.id, 1)}
                            className="p-2 hover:bg-green-50 text-emerald-600 transition-colors border-l"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {addOnOptions.length === 0 && (
                  <div className="p-16 text-center border-2 border-dashed rounded-3xl opacity-20 flex flex-col items-center gap-2">
                    <LayoutGrid size={40} />
                    <p className="font-bold uppercase text-[10px] tracking-widest">No extra options</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                  <ClipboardList size={14} /> Technician Note
                </Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or concerns..."
                  className="min-h-[100px] bg-white border-gray-200 rounded-2xl p-4 text-xs font-medium focus:ring-4 focus:ring-[#D4AF37]/10 transition-all border-none shadow-inner"
                />
              </div>
            </div>

            {/* COLUMN 3: Sticky Summary */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="p-8 flex flex-col bg-white sticky top-24 h-fit">
                <div className="space-y-8">
                  <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022C22]">Live Summary</h3>
                    <ShoppingCart size={16} className="text-[#D4AF37]" />
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Base Rate</span>
                      <span className="text-gray-900 font-black">৳{basePrice.toLocaleString()}</span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-blue-600 uppercase">
                        <span>Extras Selected</span>
                        <span className="font-black">+৳{addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Service Fee</span>
                      <span className="text-gray-900 font-black">৳{platformFee}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-gray-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Balance</span>
                    <span className="text-4xl font-black text-[#022C22] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                  </div>

                  <Button onClick={handleContinue} className="w-full h-16 rounded-2xl bg-[#022C22] hover:bg-[#064E3B] text-[#D4AF37] font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-950/20 gap-2 active:scale-95 transition-all group">
                    Confirm Booking <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="pt-10 border-t border-gray-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span className="text-[9px] font-black uppercase text-gray-500">Certified Specialists</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BadgeCheck size={16} className="text-amber-600" />
                      <span className="text-[9px] font-black uppercase text-gray-500">Full Price Protection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* RESULTS GALLERY */}
        <section className="container mx-auto px-0 md:px-4 py-8 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tighter italic">Operational Results</h2>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Real proof of our cleaning standards</p>
              </div>
              <div className="flex gap-2 p-1 bg-gray-50 rounded-full w-fit border border-gray-100">
                {['all', 'before', 'after'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBeforeAfterTab(tab)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all",
                      beforeAfterTab === tab ? "bg-[#022C22] text-[#D4AF37] shadow-lg" : "text-gray-400 hover:text-gray-900"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border shadow-inner group">
                <Image src="https://picsum.photos/seed/service-result/1200/800" alt="Work Sample" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest">
                    <Camera size={12} className="mr-2 text-[#D4AF37] inline" /> Live Execution
                  </Badge>
                </div>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-[450px] no-scrollbar pr-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] cursor-pointer transition-all shadow-sm group">
                    <Image src={`https://picsum.photos/seed/case${i}/400/300`} alt="Thumbnail" fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={24} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS SECTION */}
        <section className="container mx-auto px-0 md:px-4 py-8 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-sm border border-gray-100 p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <div className="lg:col-span-4 space-y-8">
                <div className="space-y-3">
                  <Badge className="bg-[#022C22]/10 text-[#022C22] border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Verified Experience</Badge>
                  <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tighter leading-none">Customer <br/><span className="text-[#D4AF37]">Satisfaction</span></h2>
                </div>

                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center space-y-3">
                  <p className="text-5xl font-black text-[#022C22] tracking-tighter">4.9</p>
                  <div className="flex justify-center text-[#D4AF37] gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{reviews?.length || 0} Professional Reviews</p>
                </div>

                {user ? (
                  <Card className="border-none shadow-xl bg-[#081621] text-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-[#D4AF37]/20 rounded-lg text-[#D4AF37]"><MessageSquare size={18} /></div>
                        <h4 className="text-xs font-black uppercase tracking-widest">Rate Service</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Quality Rating</p>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setReviewRating(star)} className="transition-transform active:scale-90">
                              <Star size={20} fill={star <= reviewRating ? "#D4AF37" : "none"} className={star <= reviewRating ? "text-[#D4AF37]" : "text-white/20"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Share Feedback</Label>
                        <Textarea 
                          value={reviewText}
                          onChange={e => setReviewText(e.target.value)}
                          placeholder="Your professional opinion..."
                          className="bg-white/5 border-white/10 text-white min-h-[80px] rounded-lg focus:bg-white/10 text-xs"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || !reviewText.trim()}
                        className="w-full h-11 bg-[#D4AF37] hover:bg-[#B8860B] text-[#022C22] font-black uppercase text-[10px] tracking-widest rounded-lg shadow-lg gap-2"
                      >
                        {isSubmittingReview ? <Loader2 className="animate-spin" size={14} /> : <><Send size={14} /> Submit Review</>}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><LogIn size={24} /></div>
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-xs text-blue-900">Sign in to Review</h4>
                      <p className="text-[10px] text-blue-700/60 font-medium">Authentication required to post feedback.</p>
                    </div>
                    <Button asChild variant="outline" className="w-full h-10 rounded-lg font-black uppercase text-[9px] tracking-widest border-blue-200 text-blue-600 bg-white">
                      <Link href="/login">Log In</Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 space-y-6">
                {reviewsLoading ? (
                  <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#022C22]" size={32} /></div>
                ) : reviews?.length ? (
                  <div className="grid grid-cols-1 gap-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-[#022C22] border shadow-inner uppercase text-xs">
                              {rev.userName?.[0]}
                            </div>
                            <div>
                              <h5 className="font-black text-gray-900 uppercase text-xs tracking-tight">{rev.userName}</h5>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Verified Client</p>
                            </div>
                          </div>
                          <div className="flex text-[#D4AF37] gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} className={i >= rev.rating ? "text-gray-200" : ""} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed italic border-l-2 border-[#D4AF37]/20 pl-4 py-1">
                          "{rev.text}"
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={10} /> {mounted && rev.createdAt ? format(new Date(rev.createdAt), 'PP') : '...'}
                          </span>
                          <div className="flex items-center gap-1.5 text-[8px] font-black text-[#022C22] uppercase bg-[#022C22]/5 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={10} /> Certified Standard Results
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center border-2 border-dashed rounded-3xl opacity-30 flex flex-col items-center gap-4">
                    <MessageSquare size={48} />
                    <p className="font-black uppercase tracking-widest text-[10px]">No reviews yet for this service</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* MOBILE STICKY FOOTER */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <Button 
            onClick={handleContinue}
            className="w-full h-16 rounded-2xl bg-[#022C22] text-[#D4AF37] font-black text-lg uppercase tracking-tight shadow-2xl shadow-emerald-950/30 gap-3 active:scale-95 transition-all"
          >
            Confirm ৳{totalPrice.toLocaleString()} <ArrowRight size={24} />
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}
