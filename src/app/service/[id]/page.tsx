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
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
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
  }, [subService]);

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
  const totalPrice = useMemo(() => {
    if (!baseService) return 0;
    const basePrice = baseService.basePrice || baseService.price || 0;
    const addOnPrice = addOnOptions
      .filter(a => selectedAddOnIds.includes(a.id))
      .reduce((acc, a) => acc + (a.price || 0), 0);
    return basePrice + addOnPrice;
  }, [baseService, addOnOptions, selectedAddOnIds]);

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

  if (!mounted || mainLoading || subLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!baseService) return <div className="p-20 text-center font-black uppercase text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-32 lg:pb-12">
        <div className="container mx-auto px-4 lg:py-10 max-w-6xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Image & Details */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                <div className="relative aspect-video w-full">
                  <Image 
                    src={baseService.imageUrl || 'https://picsum.photos/seed/service/800/600'} 
                    alt="Service" 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-primary text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                      {isSubServiceMode ? 'Direct Selection' : 'Full Service'}
                    </Badge>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-[#081621] tracking-tighter uppercase leading-tight">
                      {baseService.title || baseService.name}
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Star size={14} fill="currentColor" /> {baseService.rating || '5.0'}
                      </div>
                      <span className="opacity-20">|</span>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary" /> {baseService.duration || '2-4 Hours'}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    {baseService.description}
                  </p>
                </div>
              </div>

              {/* Add-ons Selection */}
              {addOnOptions.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap size={20} fill="currentColor" /></div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-[#081621]">অ্যাড-অন সার্ভিস (ঐচ্ছিক)</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addOnOptions.map((addon) => (
                      <div 
                        key={addon.id} 
                        onClick={() => toggleAddOn(addon.id)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          selectedAddOnIds.includes(addon.id) ? "border-primary bg-primary/5 shadow-inner" : "border-white bg-white hover:border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                            <Image src={addon.imageUrl || 'https://picsum.photos/seed/addon/100/100'} alt={addon.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 uppercase text-[11px] truncate leading-tight">{addon.name}</p>
                            <p className="font-black text-primary text-xs mt-1">+৳{addon.price}</p>
                          </div>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                          selectedAddOnIds.includes(addon.id) ? "bg-primary border-primary text-white" : "border-gray-200 text-transparent"
                        )}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Pricing & Sticky CTA */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white border-t-8 border-primary">
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-[#081621] pb-4 border-b">বুকিং সামারি</h3>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>বেস সার্ভিস ({isSubServiceMode ? 'সাব' : 'মেইন'})</span>
                      <span className="text-[#081621] font-black">৳{(baseService.basePrice || baseService.price)?.toLocaleString()}</span>
                    </div>

                    {selectedAddOnIds.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).map(addon => (
                          <div key={addon.id} className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                            <span>+ {addon.name}</span>
                            <span className="text-primary font-black">৳{addon.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-6 border-t-4 border-dashed border-gray-100 flex flex-col gap-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">মোট প্রদেয়</p>
                      <p className="text-5xl font-black text-primary tracking-tighter">৳{totalPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-primary mt-0.5" />
                      <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                        ১০০% স্যাটিসফ্যাকশন গ্যারান্টি। আমাদের টিম অভিজ্ঞ এবং ভেরিফাইড।
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleContinue}
                      className="w-full h-16 md:h-20 rounded-2xl font-black text-2xl md:text-4xl bg-primary hover:bg-primary/90 text-white uppercase tracking-tight shadow-xl shadow-primary/20 gap-4 group transition-all active:scale-95 px-4"
                    >
                      {t('book_now')} <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform shrink-0" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bar */}
        {!isCheckoutOpen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-between gap-4 z-[110] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Total Due</span>
              <span className="text-2xl font-black text-primary tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinue}
              className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xl uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 px-2"
            >
              {t('book_now')} <ChevronRight size={20} className="ml-1 shrink-0" />
            </Button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
