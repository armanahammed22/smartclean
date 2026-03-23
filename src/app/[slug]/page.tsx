
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { 
  CheckCircle2, 
  Star, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Loader2,
  Award,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/providers/cart-provider';
import { trackEvent } from '@/lib/tracking';
import { cn } from '@/lib/utils';

export default function DynamicLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { addToCart, setCheckoutOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageQuery = useMemoFirebase(() => 
    (db && slug) ? query(collection(db, 'landing_pages'), where('slug', '==', slug), limit(1)) : null, [db, slug]);
  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  useEffect(() => {
    if (!isLoading && (!page || !page.active) && mounted) {
      router.replace('/');
    }
  }, [page, isLoading, mounted, router]);

  useEffect(() => {
    if (page && mounted) {
      trackEvent('ViewContent', {
        content_name: page.title,
        content_category: 'Landing Page'
      });
    }
  }, [page, mounted]);

  const handleBookNow = () => {
    if (!page) return;
    
    // Create temporary service object for cart
    const promoService = {
      id: `lp-${page.id}`,
      title: `${page.title} (Promo)`,
      basePrice: page.price,
      imageUrl: page.imageUrl,
      categoryId: 'Special Promotion',
      type: 'service' as const,
      status: 'Active' as const
    };

    trackEvent('Lead', {
      content_name: page.title,
      value: page.price,
      currency: 'BDT'
    });

    addToCart(promoService as any, 1);
    // Redirect to checkout with source parameter
    router.push(`/checkout?source=${page.slug}`);
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Experience...</p>
    </div>
  );

  if (!page || !page.active) return null;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-white min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="aspect-[4/5] md:aspect-[21/9] relative w-full">
            {page.imageUrl ? (
              <Image 
                src={page.imageUrl} 
                alt={page.title} 
                fill 
                className="object-cover" 
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-[#081621] flex items-center justify-center text-primary/20"><Zap size={120} /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-20">
              <div className="container mx-auto max-w-6xl space-y-6">
                <div className="flex flex-wrap gap-3">
                  {page.offer && (
                    <Badge className="bg-[#22C55E] text-white border-none px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl animate-pulse">
                      {page.offer}
                    </Badge>
                  )}
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                    Exclusive Campaign
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] md:max-w-3xl drop-shadow-2xl">
                  {page.title}
                </h1>
                <p className="text-white/80 text-sm md:text-xl max-w-xl font-medium leading-relaxed drop-shadow-md">
                  {page.description?.slice(0, 160)}...
                </p>
                <div className="pt-4 hidden md:block">
                  <Button onClick={handleBookNow} size="lg" className="h-16 px-12 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-lg uppercase tracking-tight shadow-2xl shadow-green-600/30 gap-3">
                    Claim Offer Now <ArrowRight size={24} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS GRID */}
        {page.benefits && page.benefits.length > 0 && (
          <section className="py-16 md:py-24 container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter">Premium Benefits</h2>
              <div className="w-20 h-1.5 bg-[#22C55E] mx-auto rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {page.benefits.filter(b => !!b).map((benefit, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col gap-4 group hover:bg-white hover:shadow-2xl hover:scale-105 transition-all duration-500">
                  <div className="p-4 rounded-2xl w-fit shadow-sm transition-transform group-hover:rotate-12 bg-green-50 text-green-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-[#081621] uppercase tracking-tight">{benefit}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">Experience top-tier quality with our specialized team and industrial equipment.</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DESCRIPTION SECTION */}
        <section className="py-20 bg-[#081621] text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
            <Sparkles size={48} className="text-[#22C55E] mx-auto" />
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">Why It Matters?</h2>
            <p className="text-white/60 text-lg leading-relaxed font-medium">
              {page.description}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10">
              {[
                { icon: ShieldCheck, label: "Secure" },
                { icon: Timer, label: "Fast" },
                { icon: Award, label: "Expert" },
                { icon: Sparkles, label: "Clean" }
              ].map((kpi, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl text-primary"><kpi.icon size={24} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{kpi.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="py-24 container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter">Client Stories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "S. Ahmed", text: "Truly impressive service quality. The attention to detail is unmatched in Dhaka.", area: "Banani" },
              { name: "K. Rahman", text: "Great experience! The team was professional and polite. My home feels new again.", area: "Uttara" },
              { name: "M. Islam", text: "Fast booking and excellent execution. I highly recommend this specialized service.", area: "Dhanmondi" }
            ].map((rev, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex text-amber-400 gap-0.5">
                  {[1,2,3,4,5].map(j => <Star key={j} size={14} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 font-medium italic leading-relaxed">"{rev.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs uppercase">{rev.name[0]}</div>
                  <div>
                    <p className="font-black text-[11px] text-[#081621] uppercase tracking-tight">{rev.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{rev.area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MOBILE STICKY BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 animate-in slide-in-from-bottom-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="container mx-auto max-w-xl flex items-center justify-between gap-4">
            <div className="space-y-0.5 shrink-0">
              <p className="text-2xl font-black text-[#081621] tracking-tighter leading-none">৳{page.price?.toLocaleString()}</p>
              <p className="text-[8px] font-black text-[#22C55E] uppercase tracking-[0.2em]">{page.offer || 'Special Offer'}</p>
            </div>
            <Button onClick={handleBookNow} className="h-14 flex-1 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20">
              Book Now <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
