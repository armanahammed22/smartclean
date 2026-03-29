
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
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ServiceBookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const { addToCart, setCheckoutOpen, isCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [beforeAfterTab, setBeforeAfterTab] = useState('all');
  
  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mainServiceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: mainService, isLoading: mainLoading } = useDoc(mainServiceRef);

  const subServiceRef = useMemoFirebase(() => db ? doc(db, 'sub_services', id as string) : null, [db, id]);
  const { data: subService, isLoading: subLoading } = useDoc(subServiceRef);

  const baseService = useMemo(() => mainService || subService || null, [mainService, subService]);

  const mainId = useMemo(() => mainService?.id || subService?.mainServiceId || null, [mainService, subService]);
  
  const relatedSubsQuery = useMemoFirebase(() => {
    if (!db || !mainId) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', mainId), where('status', '==', 'Active'));
  }, [db, mainId]);
  const { data: relatedSubs } = useCollection(relatedSubsQuery);

  // Reviews Fetching
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'services', id as string, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, id]);
  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  const addOnOptions = useMemo(() => {
    if (!relatedSubs) return [];
    return relatedSubs.filter(sub => sub.id !== id && sub.isAddOnEnabled);
  }, [relatedSubs, id]);

  const basePrice = baseService?.basePrice || baseService?.price || 0;
  const addOnsTotal = addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0);
  const platformFee = 50;
  const totalPrice = basePrice + addOnsTotal + platformFee;

  const toggleAddOn = (subId: string) => {
    setSelectedAddOnIds(prev => prev.includes(subId) ? prev.filter(i => i !== subId) : [...prev, id]);
  };

  const handleContinue = () => {
    if (!baseService) return;
    addToCart({
      ...baseService,
      title: baseService.title || baseService.name,
      basePrice: totalPrice,
      imageUrl: baseService.imageUrl || '',
      type: 'service'
    } as any, 1, false);
    setCheckoutOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !id) return;
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'services', id as string, 'reviews'), {
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

  if (!mounted || mainLoading || subLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!baseService) return <div className="p-20 text-center uppercase font-black text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F2F4F7] min-h-screen">
        
        <div className="bg-white border-b border-gray-100 py-3 hidden md:block">
          <div className="container mx-auto px-4 max-w-7xl">
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Link href="/" className="hover:text-primary">Home</Link>
              <ChevronRight size={10} />
              <Link href="/services" className="hover:text-primary">Services</Link>
              <ChevronRight size={10} />
              <span className="text-primary truncate max-w-[200px]">{baseService.title || baseService.name}</span>
            </nav>
          </div>
        </div>

        <section className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-sm border border-gray-100 flex flex-col lg:grid lg:grid-cols-12 relative overflow-visible">
            
            {/* COLUMN 1: Main Service Identity */}
            <div className="lg:col-span-4 p-6 md:p-10 space-y-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border shadow-inner group">
                {baseService.imageUrl ? (
                  <Image src={baseService.imageUrl} alt="Service" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                ) : (
                  <Wrench size={48} className="text-gray-200" />
                )}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary/90 backdrop-blur-md text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm">Featured Service</Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-[#081621] uppercase tracking-tight font-headline leading-tight">
                    {baseService.title || baseService.name}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                    "{baseService.description || "Expert treatment from certified technicians."}"
                  </p>
                </div>

                <div className="text-3xl font-black text-[#D60000] tracking-tighter">৳{basePrice.toLocaleString()}</div>
                
                {/* ℹ️ NEW: SINGLE COLUMN INFO LIST WITH COLORFUL ICONS */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50 group hover:bg-amber-50 transition-colors">
                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest leading-none mb-1">Customer Rating</p>
                      <p className="text-sm font-black text-amber-900">{baseService.rating || '5.0'} / 5.0 High Score</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 group hover:bg-blue-50 transition-colors">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-700/60 tracking-widest leading-none mb-1">Average Duration</p>
                      <p className="text-sm font-black text-blue-900">{baseService.duration || '2-4 Hours Work'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest leading-none mb-1">Service Force</p>
                      <p className="text-sm font-black text-emerald-900">{baseService.teamSize || 'Professional Team'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Add-ons & Extra Logic */}
            <div className="lg:col-span-5 p-6 md:p-10 space-y-8 bg-gray-50/30 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enhance Your Service</h3>
                <Badge variant="secondary" className="bg-white border text-[8px] font-black uppercase">Optional Add-ons</Badge>
              </div>

              <div className="space-y-3">
                {addOnOptions.map((addon) => (
                  <div 
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.id)}
                    className={cn(
                      "group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white hover:shadow-md",
                      selectedAddOnIds.includes(addon.id) ? "border-primary bg-primary/5 shadow-inner" : "border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                      selectedAddOnIds.includes(addon.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                    )}>
                      {selectedAddOnIds.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] md:text-xs font-black text-gray-900 uppercase truncate tracking-tight">{addon.name}</h5>
                      <p className="text-[10px] text-primary font-black uppercase mt-0.5">+৳{addon.price}</p>
                    </div>
                    {addon.imageUrl && (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border bg-gray-50">
                        <Image src={addon.imageUrl} alt="Addon" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                ))}
                {addOnOptions.length === 0 && (
                  <div className="p-16 text-center border-2 border-dashed rounded-3xl opacity-20 flex flex-col items-center gap-2">
                    <LayoutGrid size={32} />
                    <p className="font-bold uppercase text-[9px] tracking-widest">No extra options</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Special Instructions</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Any special requests for the technician..."
                  className="min-h-[120px] bg-white border-gray-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* COLUMN 3: Sticky Order Summary */}
            <div className="lg:col-span-3">
              <div className="p-6 md:p-10 flex flex-col bg-white lg:sticky lg:top-24 h-fit">
                <div className="space-y-8 flex-1">
                  <div className="pb-4 border-b">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Booking Summary</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Service Charge</span>
                      <span className="text-gray-900 font-black">৳{basePrice.toLocaleString()}</span>
                    </div>
                    {selectedAddOnIds.length > 0 && (
                      <div className="flex justify-between text-xs font-bold text-blue-600 uppercase animate-in slide-in-from-top-1">
                        <span>Extra Services</span>
                        <span className="font-black">+৳{addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Platform Fee</span>
                      <span className="text-gray-900 font-black">৳{platformFee}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-gray-100 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Payable Amount</span>
                    <span className="text-5xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                  </div>

                  <div className="space-y-4 pt-6">
                    <Button onClick={handleContinue} className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary/20 gap-3 active:scale-95 transition-transform group">
                      Confirm Booking <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      <ShieldCheck size={12} className="text-green-500" /> Secure Checkout Guaranteed
                    </div>
                  </div>
                </div>

                <div className="pt-10 mt-10 border-t space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:rotate-12 transition-transform"><Shield size={18} /></div>
                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-tighter">Verified Professionals</span>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:rotate-12 transition-transform"><BadgeCheck size={18} /></div>
                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-tighter">Pay After Service</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* RESULTS GALLERY */}
        <section className="container mx-auto px-0 md:px-4 py-12 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-sm border border-gray-100 p-6 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b pb-8">
              <div>
                <h2 className="text-3xl font-black text-[#081621] uppercase tracking-tighter italic">Results Gallery</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Real proof of our cleaning standards</p>
              </div>
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-full w-fit border shadow-inner">
                {['all', 'before', 'after'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBeforeAfterTab(tab)}
                    className={cn(
                      "px-8 py-2.5 rounded-full text-[10px] font-black uppercase transition-all duration-300",
                      beforeAfterTab === tab ? "bg-primary text-white shadow-xl scale-105" : "text-gray-400 hover:text-gray-900"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 relative aspect-video rounded-[2.5rem] overflow-hidden bg-gray-100 border shadow-2xl group">
                <Image src="https://picsum.photos/seed/service-result/1200/800" alt="Work Sample" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <Badge className="bg-white/20 backdrop-blur-xl text-white border border-white/20 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em]">
                    <Camera size={14} className="mr-3 text-primary" /> Active Job Result
                  </Badge>
                </div>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-[500px] no-scrollbar pr-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden border-4 border-transparent hover:border-primary cursor-pointer transition-all shadow-md group">
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

        {/* 💬 CUSTOMER REVIEWS SECTION */}
        <section className="container mx-auto px-0 md:px-4 py-12 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-sm border border-gray-100 p-6 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Review Statistics */}
              <div className="lg:col-span-4 space-y-10">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">Community Feedback</Badge>
                  <h2 className="text-3xl font-black text-[#081621] uppercase tracking-tighter leading-none">What Our <br/><span className="text-primary">Clients</span> Say</h2>
                </div>

                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 text-center space-y-4">
                  <p className="text-6xl font-black text-[#081621] tracking-tighter">4.9</p>
                  <div className="flex justify-center text-amber-400 gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Based on {reviews?.length || 0} Professional Reviews</p>
                </div>

                {/* Write Review Form - Logged In Only */}
                {user ? (
                  <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-primary/20 rounded-xl text-primary"><MessageSquare size={20} /></div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Write a Review</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Rate the service</p>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setReviewRating(star)} className="transition-transform active:scale-90">
                              <Star size={24} fill={star <= reviewRating ? "#faca51" : "none"} className={star <= reviewRating ? "text-[#faca51]" : "text-white/20"} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Detailed Feedback</Label>
                        <Textarea 
                          value={reviewText}
                          onChange={e => setReviewText(e.target.value)}
                          placeholder="How was your experience?"
                          className="bg-white/5 border-white/10 text-white min-h-[100px] rounded-xl focus:bg-white/10 text-sm"
                        />
                      </div>

                      <Button 
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || !reviewText.trim()}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl shadow-primary/20 gap-2"
                      >
                        {isSubmittingReview ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Post Review</>}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><LogIn size={32} /></div>
                    <div className="space-y-2">
                      <h4 className="font-black uppercase text-sm text-blue-900">Sign in to Review</h4>
                      <p className="text-xs text-blue-700/60 font-medium">Please login to your account to share your feedback about this service.</p>
                    </div>
                    <Button asChild variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-blue-200 text-blue-600 bg-white hover:bg-blue-50">
                      <Link href="/login">Log In Now</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-8 space-y-8">
                {reviewsLoading ? (
                  <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : reviews?.length ? (
                  <div className="grid grid-cols-1 gap-6">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-primary border shadow-inner uppercase">
                              {rev.userName?.[0]}
                            </div>
                            <div>
                              <h5 className="font-black text-gray-900 uppercase text-xs tracking-tight">{rev.userName}</h5>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Verified Client</p>
                            </div>
                          </div>
                          <div className="flex text-amber-400 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} className={i >= rev.rating ? "text-gray-200" : ""} />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 font-medium leading-relaxed italic border-l-4 border-primary/10 pl-6 py-2">
                          "{rev.text}"
                        </p>
                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> {mounted && rev.createdAt ? format(new Date(rev.createdAt), 'PP') : '...'}
                          </span>
                          <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full">
                            <CheckCircle2 size={10} /> Certified Result
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center border-2 border-dashed rounded-[3rem] opacity-30 flex flex-col items-center gap-4">
                    <MessageSquare size={48} />
                    <p className="font-black uppercase tracking-widest text-xs">No reviews for this service yet.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* MOBILE STICKY BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Payable</span>
            <span className="text-2xl font-black text-[#D60000] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
          </div>
          <Button 
            onClick={handleContinue}
            className="flex-1 h-14 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            Confirm Booking <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}
