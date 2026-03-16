"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  Zap,
  Star,
  CheckCircle2,
  Info,
  MessageSquare,
  Lock,
  ChevronRight,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  // Selection States
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch Service Data
  const serviceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: serviceLoading } = useDoc(serviceRef);

  // Fetch Linked Sub-Services
  const subServicesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', id), where('status', '==', 'Active'));
  }, [db, id]);
  const { data: subServices, isLoading: subLoading } = useCollection(subServicesQuery);

  // Fetch Reviews
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'service_reviews'), where('serviceId', '==', id), orderBy('createdAt', 'desc'));
  }, [db, id]);
  const { data: reviews } = useCollection(reviewsQuery);

  // Calculate Totals
  const addonsTotal = useMemo(() => {
    return subServices
      ?.filter(s => selectedSubIds.includes(s.id))
      .reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
  }, [subServices, selectedSubIds]);

  const totalPrice = useMemo(() => {
    if (!service) return 0;
    return (service.basePrice || 0) + addonsTotal;
  }, [service, addonsTotal]);

  const handleContinueBooking = () => {
    if (!service) return;
    const selectedSubs = subServices?.filter(s => selectedSubIds.includes(s.id)) || [];
    const combinedTitle = selectedSubs.length > 0 
      ? `${service.title} (${selectedSubs.map(s => s.name).join(', ')})`
      : service.title;

    addToCart({
      ...service,
      title: combinedTitle,
      basePrice: totalPrice,
    } as any);
    setCheckoutOpen(true);
  };

  const handleAddReview = async () => {
    if (!user || !reviewText.trim() || !db) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'service_reviews'), {
        serviceId: id,
        userId: user.uid,
        userName: user.displayName || 'Customer',
        userEmail: user.email,
        rating,
        text: reviewText,
        createdAt: new Date().toISOString()
      });
      setReviewText("");
      toast({ title: "Review Shared", description: "Thank you for your feedback!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to post review." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (serviceLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!service) return <div className="p-20 text-center font-bold text-muted-foreground">Service Not Found</div>;

  return (
    <PublicLayout>
      <div className="bg-[#F8FAFC] min-h-screen pb-24 lg:pb-12">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 rounded-full hover:bg-white shadow-sm transition-all">
            <ArrowLeft size={18} /> {t('back_to_list')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: Service Media & Detailed Info (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl bg-gray-200 border-4 border-white group">
                <Image 
                  src={service.imageUrl || 'https://picsum.photos/seed/srv/1200/800'} 
                  alt={service.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  priority
                />
                <div className="absolute top-6 left-6">
                  <Badge className="bg-primary text-white border-none px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                    {service.categoryId || 'Premium'}
                  </Badge>
                </div>
              </div>

              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-tight">{service.title}</h1>
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={16} fill="currentColor" /> {reviews?.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}
                        </div>
                        <span className="opacity-20">|</span>
                        <div className="flex items-center gap-1.5"><Clock size={16} className="text-primary" /> {service.duration || '2-4 Hours'}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 font-medium leading-relaxed border-t pt-6 whitespace-pre-wrap">
                      {service.description}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* REVIEWS SECTION */}
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" /> Reviews ({reviews?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Write a Review */}
                  {user ? (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                      <p className="text-xs font-black uppercase text-primary tracking-widest">Share Your Experience</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setRating(s)} className={cn("transition-colors", rating >= s ? "text-amber-500" : "text-gray-300")}>
                            <Star size={20} fill={rating >= s ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                      <Textarea 
                        placeholder="Type your review here..." 
                        value={reviewText} 
                        onChange={(e) => setReviewText(e.target.value)}
                        className="bg-white border-none rounded-xl text-sm"
                      />
                      <Button onClick={handleAddReview} disabled={isSubmittingReview || !reviewText.trim()} className="w-full rounded-xl font-bold h-11">
                        {isSubmittingReview ? <Loader2 className="animate-spin" /> : "Post Review"}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 rounded-3xl border border-dashed text-center space-y-3">
                      <Lock size={24} className="mx-auto text-gray-400" />
                      <p className="text-sm font-bold text-gray-600">Want to share your feedback?</p>
                      <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-primary text-primary" asChild>
                        <Link href="/login">Login to Write Review</Link>
                      </Button>
                    </div>
                  )}

                  {/* Review List */}
                  <div className="space-y-6">
                    {reviews?.map((review) => (
                      <div key={review.id} className="space-y-2 border-b border-gray-50 pb-6 last:border-none">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary"><User size={16} /></div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{review.userName}</p>
                              <div className="flex gap-0.5 text-amber-500">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{review.createdAt ? format(new Date(review.createdAt), 'MMM dd, yyyy') : 'Recently'}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed pl-11">{review.text}</p>
                      </div>
                    ))}
                    {!reviews?.length && <p className="text-center text-xs text-muted-foreground italic py-4">No reviews yet. Be the first to share!</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COLUMN 2: Additional Services (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white h-full min-h-[400px]">
                <CardHeader className="p-8 border-b bg-gray-50/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap size={20} fill="currentColor" /></div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-gray-900">Additional Services</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {subLoading ? (
                    <div className="py-20 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
                  ) : subServices?.map((sub) => (
                    <div 
                      key={sub.id} 
                      className={cn(
                        "flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white group",
                        selectedSubIds.includes(sub.id) ? "border-primary bg-primary/5" : "border-gray-50 hover:border-gray-200"
                      )}
                      onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox 
                          checked={selectedSubIds.includes(sub.id)} 
                          className="h-6 w-6 rounded-lg data-[state=checked]:bg-primary border-gray-300"
                        />
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{sub.name}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {sub.duration}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-sm text-primary">৳{sub.price.toLocaleString()}</span>
                    </div>
                  ))}
                  {!subServices?.length && !subLoading && (
                    <div className="p-12 text-center text-muted-foreground italic bg-gray-50/50 rounded-[2rem] border-2 border-dashed">
                      No additional tasks available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* COLUMN 3: Booking Summary (lg:col-span-3) */}
            <div className="lg:col-span-3 hidden lg:block sticky top-24">
              <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-[#081621] text-white p-8">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Booking Summary</CardTitle>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Pricing & Breakdown</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
                      <span>Base Service</span>
                      <span className="text-gray-900">৳{service.basePrice.toLocaleString()}</span>
                    </div>
                    {selectedSubIds.length > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase animate-in fade-in slide-in-from-top-1">
                        <span>Add-ons ({selectedSubIds.length})</span>
                        <span className="text-gray-900">+৳{addonsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Estimated Total</span>
                        <span className="text-3xl font-black text-gray-900 tracking-tighter leading-none mt-1">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full mb-1">VAT INC</Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    {[
                      { icon: ShieldCheck, text: "Verified Professionals" },
                      { icon: Zap, text: "Instant Booking" },
                      { icon: CheckCircle2, text: "Secure Service" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                        <item.icon size={16} className="text-primary" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleContinueBooking} 
                    className="w-full h-16 rounded-2xl font-black text-base shadow-xl shadow-primary/30 uppercase tracking-tight gap-2 transition-all hover:scale-[1.02]"
                  >
                    Continue Booking <ChevronRight size={20} />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2rem]">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-fit">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Estimated</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <Button 
              onClick={handleContinueBooking} 
              className="h-14 px-8 rounded-full font-black text-xs uppercase shadow-lg shadow-primary/30 gap-2 flex-1 transition-all active:scale-95"
            >
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
