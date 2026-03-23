'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Star, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Users, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/public-layout';
import { useCart } from '@/components/providers/cart-provider';
import { trackEvent } from '@/lib/tracking';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export default function DeepCleaningLandingPage() {
  const router = useRouter();
  const { addToCart, setCheckoutOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    trackEvent('ViewContent', {
      content_name: 'Deep Cleaning Promo Landing',
      content_category: 'Special Promo'
    });
  }, []);

  const handleBookNow = () => {
    // 1. Define the promo service object
    const promoService = {
      id: 'promo-deep-clean-20',
      title: 'Deep Cleaning (Special Promo)',
      basePrice: 4000, // Original was 5000
      imageUrl: PlaceHolderImages.find(img => img.id === 'landing-deep-clean')?.imageUrl || '',
      categoryId: 'Cleaning',
      type: 'service' as const,
      status: 'Active' as const,
      source: 'cleaning_landing' // Tracking source metadata
    };

    // 2. Track Lead Event
    trackEvent('Lead', {
      content_name: 'Deep Cleaning Landing Booking',
      value: 4000,
      currency: 'BDT'
    });

    // 3. Add to cart and redirect
    addToCart(promoService as any, 1);
    router.push('/checkout?source=cleaning_landing');
  };

  if (!mounted) return null;

  const heroImg = PlaceHolderImages.find(img => img.id === 'landing-deep-clean')?.imageUrl;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-white min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="aspect-[4/5] md:aspect-[21/9] relative w-full">
            <Image 
              src={heroImg || ''} 
              alt="Professional Deep Cleaning" 
              fill 
              className="object-cover" 
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-20">
              <div className="container mx-auto max-w-6xl space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-[#22C55E] text-white border-none px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl animate-pulse">
                    20% OFF TODAY
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                    Eid Special Offer
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] md:max-w-3xl">
                  Revive Your Home With <span className="text-[#22C55E]">Deep Cleaning</span>
                </h1>
                <p className="text-white/80 text-sm md:text-xl max-w-xl font-medium leading-relaxed">
                  Experience a 5-star professional cleaning that reaches every corner. Say goodbye to dust, allergens, and germs today.
                </p>
                <div className="pt-4 hidden md:block">
                  <Button onClick={handleBookNow} size="lg" className="h-16 px-12 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-lg uppercase tracking-tight shadow-2xl shadow-green-600/30 gap-3">
                    Claim My 20% Discount <ArrowRight size={24} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS GRID */}
        <section className="py-16 md:py-24 container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter">Why Choose Smart Clean?</h2>
            <div className="w-20 h-1.5 bg-[#22C55E] mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Verified Pros", desc: "Every technician is background-checked and trained for 100+ hours.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Zap, title: "Modern Tech", desc: "We use high-grade industrial vacuum and steam cleaners for superior results.", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: Award, title: "Satisfaction Garanteed", desc: "Not happy? We will re-clean your home for free within 24 hours.", color: "text-green-600", bg: "bg-green-50" }
            ].map((b, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col gap-4 group hover:bg-white hover:shadow-2xl hover:scale-105 transition-all duration-500">
                <div className={cn("p-4 rounded-2xl w-fit shadow-sm transition-transform group-hover:rotate-12", b.bg, b.color)}>
                  <b.icon size={32} />
                </div>
                <h3 className="text-xl font-black text-[#081621] uppercase tracking-tight">{b.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SCOPE SECTION */}
        <section className="py-20 bg-[#081621] text-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <Badge className="bg-primary text-white border-none uppercase font-black tracking-widest px-4 py-1.5 rounded-full">Service Scope</Badge>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">Complete <span className="text-primary">In-Depth</span> Treatment</h2>
                <p className="text-white/60 text-lg">Our deep cleaning is 3x more thorough than a regular clean. Here's what's included:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Kitchen Degreasing",
                    "Bathroom Sanitization",
                    "Deep Floor Scrubbing",
                    "Ceiling Fan Cleaning",
                    "Window & Net Washing",
                    "Furniture Dusting",
                    "Switchboard Cleaning",
                    "Wall Spot Removal"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                      <CheckCircle2 size={20} className="text-[#22C55E]" />
                      <span className="font-bold uppercase text-xs tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl">
                <Image src="https://picsum.photos/seed/deepscope/800/800" alt="Cleaning Scope" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" />
                <div className="absolute bottom-10 left-10 right-10 bg-white p-6 rounded-3xl text-black">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} fill="#f59e0b" className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Recommended</span>
                  </div>
                  <p className="font-bold text-sm leading-snug">"It feels like we just moved into a brand new home!"</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest">— Happy Customer from Gulshan</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="py-24 container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter">What Clients Say</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <Star size={16} fill="#22C55E" className="text-[#22C55E]" /> Trusted by 1,000+ Households
              </p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-2xl border">
              <div className="text-right">
                <p className="text-2xl font-black leading-none">4.9/5</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Overall Rating</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex gap-0.5 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Sarah J.", text: "The team arrived on time and did an incredible job with the kitchen and bathrooms. Worth every Taka!", area: "Banani" },
              { name: "Rafiq Ahmed", text: "I've tried many services in Dhaka, but Smart Clean's tech and professionalism are on another level.", area: "Uttara" },
              { name: "Mehnaz Khan", text: "Highly recommended for post-renovation cleaning. They removed every bit of dust from the walls.", area: "Dhanmondi" }
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

        {/* FINAL CTA */}
        <section className="py-20 bg-gray-50 border-y border-gray-100 mb-20 md:mb-0">
          <div className="container mx-auto px-4 text-center space-y-8 max-w-2xl">
            <Sparkles size={48} className="text-[#22C55E] mx-auto" />
            <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter leading-none">Ready for a <span className="text-[#22C55E]">Spotless</span> Home?</h2>
            <p className="text-gray-500 text-lg font-medium">Claim your 20% discount now. Our teams are filling up fast for this weekend!</p>
            <Button onClick={handleBookNow} size="lg" className="h-16 px-12 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-lg uppercase tracking-tight shadow-xl shadow-green-600/30 gap-3 group">
              Book Deep Cleaning Now <TrendingUp size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </div>
        </section>

        {/* MOBILE STICKY BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 animate-in slide-in-from-bottom-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest line-through decoration-red-400">৳5,000</p>
              <p className="text-2xl font-black text-[#081621] tracking-tighter leading-none">৳4,000</p>
              <p className="text-[8px] font-black text-[#22C55E] uppercase tracking-[0.2em]">Promo Applied</p>
            </div>
            <Button onClick={handleBookNow} className="h-14 flex-1 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20">
              Claim 20% OFF & Book
            </Button>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
