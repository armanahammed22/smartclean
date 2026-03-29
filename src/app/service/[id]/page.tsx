
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Crown,
  Trophy,
  Gem,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ServiceBookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen, isCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [isSubServiceMode, setIsSubServiceMode] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Load data as Main Service
  const mainServiceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: mainService, isLoading: mainLoading } = useDoc(mainServiceRef);

  // 2. Load data as Sub Service (Fallback)
  const subServiceRef = useMemoFirebase(() => db ? doc(db, 'sub_services', id as string) : null, [db, id]);
  const { data: subService, isLoading: subLoading } = useDoc(subServiceRef);

  // 3. Determine actual base service
  const baseService = useMemo(() => {
    if (mainService) return mainService;
    if (subService) return subService;
    return null;
  }, [mainService, subService]);

  useEffect(() => {
    if (subService) setIsSubServiceMode(true);
    if (baseService) {
      document.title = `${baseService.title || baseService.name} - Premium Booking | Smart Clean`;
    }
  }, [subService, baseService]);

  // 4. Fetch related Sub-services for Add-ons
  const mainId = useMemo(() => {
    if (mainService) return mainService.id;
    if (subService) return subService.mainServiceId;
    return null;
  }, [mainService, subService]);

  const relatedSubsQuery = useMemoFirebase(() => {
    if (!db || !mainId) return null;
    return query(
      collection(db, 'sub_services'), 
      where('mainServiceId', '==', mainId),
      where('status', '==', 'Active')
    );
  }, [db, mainId]);

  const { data: relatedSubs, isLoading: subsLoading } = useCollection(relatedSubsQuery);

  // Filter out the base service from add-ons if in sub-service mode
  const addOnOptions = useMemo(() => {
    if (!relatedSubs) return [];
    return relatedSubs.filter(sub => sub.id !== id && sub.isAddOnEnabled);
  }, [relatedSubs, id]);

  // Pricing Logic
  const subtotal = useMemo(() => {
    if (!baseService) return 0;
    return baseService.basePrice || baseService.price || 0;
  }, [baseService]);

  const addOnsTotal = useMemo(() => {
    return addOnOptions
      .filter(a => selectedAddOnIds.includes(a.id))
      .reduce((acc, a) => acc + (a.price || 0), 0);
  }, [addOnOptions, selectedAddOnIds]);

  const totalPrice = subtotal + addOnsTotal;

  const toggleAddOn = (subId: string) => {
    setSelectedAddOnIds(prev => 
      prev.includes(subId) ? prev.filter(i => i !== subId) : [...prev, subId]
    );
  };

  const handleContinue = () => {
    if (!baseService) return;
    const title = baseService.title || baseService.name;

    addToCart({
      ...baseService,
      title: title,
      basePrice: totalPrice,
      imageUrl: baseService.imageUrl || '',
      type: 'service'
    } as any, 1, false);
    
    setCheckoutOpen(true);
  };

  if (!mounted || mainLoading || subLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#022C22]">
      <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
      <p className="mt-4 text-[#D4AF37] font-black uppercase tracking-widest text-[10px]">Refining Experience...</p>
    </div>
  );

  if (!baseService) return <div className="p-20 text-center font-black uppercase text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#FDFDFD] min-h-screen pb-32 lg:pb-20 animate-in fade-in duration-1000">
        
        {/* LUXURY HERO HEADER */}
        <section className="bg-[#022C22] text-white py-12 md:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] opacity-5 blur-[120px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37] opacity-5 blur-[100px] -ml-32 -mb-32" />
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-[#D4AF37]" />
                <Badge className="bg-[#D4AF37] text-[#022C22] border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-xl">
                  <Crown size={12} className="mr-2" /> Elite Standard
                </Badge>
                <div className="h-px w-8 bg-[#D4AF37]" />
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9] italic">
                {baseService.title || baseService.name}
              </h1>
              <p className="text-[#D4AF37]/80 text-sm md:text-xl max-w-2xl font-medium leading-relaxed italic">
                {baseService.description?.substring(0, 120)}...
              </p>
            </div>
          </div>
        </section>

        {/* 3-COLUMN CONTENT ENGINE (Updated Order) */}
        <div className="container mx-auto px-4 -mt-10 md:-mt-16 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: MAIN SERVICE (LEFT) */}
            <div className="lg:col-span-6 space-y-8 order-1">
              <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-gray-50">
                <div className="relative aspect-[16/10] w-full group">
                  <Image 
                    src={baseService.imageUrl || 'https://picsum.photos/seed/luxury/800/600'} 
                    alt={baseService.title || baseService.name} 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    unoptimized 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#022C22]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="space-y-1">
                      <Badge className="bg-[#D4AF37] text-[#022C22] font-black uppercase text-[8px] tracking-widest px-3">Featured</Badge>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Signature Treatment</h2>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white flex flex-col items-center">
                      <Star size={20} fill="#D4AF37" className="text-[#D4AF37] mb-1" />
                      <span className="text-sm font-black">{baseService.rating || '5.0'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 md:p-12 space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { icon: Clock, label: "Duration", val: baseService.duration || "2-4 Hrs" },
                      { icon: Users, label: "Team", val: baseService.teamSize || "2 Pros" },
                      { icon: Gem, label: "Tools", val: "Elite Kit" },
                      { icon: Trophy, label: "Support", val: "24/7 VIP" }
                    ].map((feat, i) => (
                      <div key={i} className="flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-gray-50 rounded-xl text-[#022C22] border border-gray-100"><feat.icon size={20} /></div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{feat.label}</p>
                          <p className="text-[10px] font-bold text-gray-900 uppercase">{feat.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#022C22] flex items-center gap-3">
                      <div className="h-px w-6 bg-[#D4AF37]" /> Excellence in Every Detail
                    </h3>
                    <p className="text-gray-500 text-sm md:text-base leading-loose font-medium italic">
                      {baseService.description || "Experience our signature high-precision cleaning methodology designed for the most discerning clients."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Hospital Grade Sanitization",
                      "Eco-Friendly Signature Scents",
                      "Multi-Surface Specialized Care",
                      "Post-Service Detail Inspection"
                    ].map((point, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-[#D4AF37]/30 transition-colors">
                        <div className="h-6 w-6 rounded-full bg-[#022C22] flex items-center justify-center text-[#D4AF37]"><Check size={14} strokeWidth={4} /></div>
                        <span className="text-[10px] md:text-xs font-black uppercase text-gray-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: ENHANCEMENTS (MIDDLE) */}
            <div className="lg:col-span-3 space-y-6 order-2">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]"><Sparkles size={20} fill="currentColor" /></div>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#022C22]">Curated Add-ons</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {addOnOptions.length > 0 ? addOnOptions.map((addon) => (
                  <div 
                    key={addon.id} 
                    onClick={() => toggleAddOn(addon.id)}
                    className={cn(
                      "p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 relative group",
                      selectedAddOnIds.includes(addon.id) 
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_10px_30px_rgba(212,175,55,0.1)]" 
                        : "border-gray-100 bg-white hover:border-[#D4AF37]/30 shadow-sm"
                    )}
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image src={addon.imageUrl || 'https://picsum.photos/seed/addon/200/200'} alt={addon.name} fill className="object-cover" unoptimized />
                      {selectedAddOnIds.includes(addon.id) && (
                        <div className="absolute inset-0 bg-[#022C22]/20 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="bg-[#D4AF37] text-[#022C22] p-2 rounded-full shadow-2xl animate-in zoom-in">
                            <CheckSquare size={24} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-[#022C22] uppercase text-xs leading-tight flex-1">{addon.name}</h4>
                        <span className="font-black text-[#D4AF37] text-sm ml-2">৳{addon.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock size={10} /> {addon.duration || '30m'}</span>
                        <span className="text-[#D4AF37]">Premium Care</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center border-2 border-dashed rounded-[2.5rem] opacity-20 flex flex-col items-center gap-3">
                    <Zap size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Add-ons Available</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: SUMMARY (RIGHT) */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 order-3">
              <Card className="rounded-[2.5rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden bg-white border-t-8 border-[#D4AF37]">
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#022C22] pb-4 border-b border-gray-100 flex items-center gap-2">
                      <Trophy size={18} className="text-[#D4AF37]" /> Booking Summary
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-gray-400">Master Service</span>
                        <span className="text-sm font-black text-[#022C22]">৳{subtotal.toLocaleString()}</span>
                      </div>

                      {selectedAddOnIds.length > 0 && (
                        <div className="space-y-3 pt-2 animate-in zoom-in-95">
                          <p className="text-[9px] font-black uppercase text-[#D4AF37]">Selected Enhancements</p>
                          {addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).map(addon => (
                            <div key={addon.id} className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                              <span>{addon.name}</span>
                              <span className="text-[#022C22]">৳{addon.price}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-6 border-t-2 border-dashed border-gray-100 space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                          <span>Subtotal</span>
                          <span>৳{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                          <span>VAT (0%)</span>
                          <span>৳0</span>
                        </div>
                        <div className="pt-4 flex flex-col gap-1">
                          <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Total Investment</p>
                          <p className="text-5xl font-black text-[#022C22] tracking-tighter">৳{totalPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-[#022C22]/5 rounded-2xl border border-[#022C22]/10 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-[#022C22] mt-0.5" />
                      <p className="text-[9px] font-bold text-[#022C22] leading-relaxed uppercase">
                        100% Satisfaction Guaranteed. Verified Elite Professionals only.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleContinue}
                      className="w-full h-16 rounded-2xl font-black text-xl bg-[#022C22] hover:bg-[#064E3B] text-white uppercase tracking-tighter shadow-2xl shadow-[#022C22]/20 gap-3 group transition-all active:scale-95"
                    >
                      Complete Booking <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {/* MOBILE STICKY LUXURY BAR */}
        {!isCheckoutOpen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-between gap-4 z-[110] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.3em] leading-none mb-1">Total Payable</span>
              <span className="text-2xl font-black text-[#022C22] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinue}
              className="flex-1 h-14 rounded-2xl bg-[#022C22] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-[#022C22]/20 gap-2"
            >
              Continue Booking <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
