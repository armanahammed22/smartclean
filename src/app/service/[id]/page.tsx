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
  Eye
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
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [beforeAfterTab, setBeforeAfterTab] = useState('all');
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slug-based lookup with fallback to ID
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
  const addOnsTotal = addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0);
  const platformFee = 50;
  const totalPrice = basePrice + addOnsTotal + platformFee;

  const toggleAddOn = (subId: string) => {
    setSelectedAddOnIds(prev => prev.includes(subId) ? prev.filter(i => i !== subId) : [...prev, subId]);
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
        
        {/* Breadcrumbs - Reduced Gap */}
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

        {/* Integrated Unified Block */}
        <section className="container mx-auto px-0 md:px-4 py-0 md:py-4 max-w-7xl">
          <div className="bg-white lg:rounded-xl shadow-lg border border-gray-100 flex flex-col lg:grid lg:grid-cols-12 relative">
            
            {/* COLUMN 1: Main Service (Left) */}
            <div className="lg:col-span-4 p-6 md:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center border shadow-inner group">
                {baseService.imageUrl ? (
                  <Image src={baseService.imageUrl} alt="Service" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                ) : (
                  <Wrench size={48} className="text-gray-200" />
                )}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-[#022C22] text-[#D4AF37] border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm shadow-lg">Premium Tier</Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-xl md:text-2xl font-black text-[#081621] uppercase tracking-tight font-headline leading-tight">
                    {baseService.title || baseService.name}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    {baseService.description || "Expert level professional treatment for discerning clients."}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#022C22]">৳{basePrice.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Rate</span>
                </div>
                
                {/* Colorful Vertical Info Column */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100/50 group">
                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-amber-700/60 tracking-widest leading-none mb-1">Rating</p>
                      <p className="text-xs font-black text-amber-900">{baseService.rating || '5.0'} / 5.0</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100/50 group">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-blue-700/60 tracking-widest leading-none mb-1">Estimated Time</p>
                      <p className="text-xs font-black text-blue-900">{baseService.duration || 'Flexible'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100/50 group">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-emerald-700/60 tracking-widest leading-none mb-1">Team Deployment</p>
                      <p className="text-xs font-black text-emerald-900">{baseService.teamSize || 'Verified Pros'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Add-ons (Center) */}
            <div className="lg:col-span-5 p-6 md:p-8 space-y-8 bg-gray-50/20 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tailor Your Experience</h3>
                <Badge variant="outline" className="text-[8px] font-black uppercase border-[#D4AF37] text-[#D4AF37]">Add-ons</Badge>
              </div>

              <div className="space-y-3">
                {addOnOptions.map((addon) => (
                  <div 
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.id)}
                    className={cn(
                      "group p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white hover:shadow-md",
                      selectedAddOnIds.includes(addon.id) ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-inner" : "border-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                      selectedAddOnIds.includes(addon.id) ? "bg-[#D4AF37] border-[#D4AF37] text-[#022C22]" : "border-gray-200"
                    )}>
                      {selectedAddOnIds.includes(addon.id) && <Check size={12} strokeWidth={4} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] md:text-xs font-black text-gray-900 uppercase truncate tracking-tight">{addon.name}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-[#D4AF37] uppercase">+৳{addon.price}</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase">• {addon.duration || '30m'}</span>
                      </div>
                    </div>
                    {addon.imageUrl && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border bg-gray-50">
                        <Image src={addon.imageUrl} alt="Addon" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                ))}
                {addOnOptions.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20 flex flex-col items-center gap-2">
                    <LayoutGrid size={32} />
                    <p className="font-bold uppercase text-[9px] tracking-widest">No extra options</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Technician Note (Optional)</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for the visit..."
                  className="min-h-[100px] bg-white border-gray-200 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
            </div>

            {/* COLUMN 3: Sticky Summary (Right) */}
            <div className="lg:col-span-3">
              <div className="p-6 md:p-8 flex flex-col bg-white lg:sticky lg:top-24 h-fit">
                <div className="space-y-8 flex-1">
                  <div className="pb-4 border-b border-gray-100">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#022C22]">Live Summary</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Base Rate</span>
                      <span className="text-gray-900 font-black">৳{basePrice.toLocaleString()}</span>
                    </div>
                    {selectedAddOnIds.length > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-blue-600 uppercase">
                        <span>Extras</span>
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

                  <div className="space-y-4 pt-6">
                    <Button onClick={handleContinue} className="w-full h-14 rounded-xl bg-[#022C22] hover:bg-[#064E3B] text-[#D4AF37] font-black uppercase text-xs tracking-widest shadow-xl gap-2 active:scale-95 transition-transform group">
                      Checkout Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      <ShieldCheck size={12} className="text-emerald-600" /> Secure Processing
                    </div>
                  </div>
                </div>

                <div className="pt-10 mt-10 border-t border-gray-100 space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm"><Shield size={16} /></div>
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">Licensed Specialists</span>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shadow-sm"><BadgeCheck size={16} /></div>
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">Full Protection</span>
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
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Real proof of আমাদের cleaning standards</p>
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
                      <Eye size={20} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 💬 CUSTOMER REVIEWS SECTION */}
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
                            <CheckCircle2 size={10} /> Professional Quality Result
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Due</span>
            <span className="text-xl font-black text-[#D60000] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
          </div>
          <Button 
            onClick={handleContinue}
            className="flex-1 h-14 rounded-xl bg-[#022C22] text-[#D4AF37] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20"
          >
            Confirm <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}
