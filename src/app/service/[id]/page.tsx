
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
  ClipboardList,
  Shield,
  BadgeCheck,
  RefreshCcw,
  Camera,
  MessageSquare,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ServiceBookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen, isCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [beforeAfterTab, setBeforeAfterTab] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Load data as Main Service
  const mainServiceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: mainService, isLoading: mainLoading } = useDoc(mainServiceRef);

  // 2. Load data as Sub Service (Fallback)
  const subServiceRef = useMemoFirebase(() => db ? doc(db, 'sub_services', id as string) : null, [db, id]);
  const { data: subService, isLoading: subLoading } = useDoc(subServiceRef);

  const baseService = useMemo(() => mainService || subService || null, [mainService, subService]);

  // 3. Fetch related Sub-services for Add-ons
  const mainId = useMemo(() => mainService?.id || subService?.mainServiceId || null, [mainService, subService]);
  const relatedSubsQuery = useMemoFirebase(() => {
    if (!db || !mainId) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', mainId), where('status', '==', 'Active'));
  }, [db, mainId]);
  const { data: relatedSubs } = useCollection(relatedSubsQuery);

  const addOnOptions = useMemo(() => {
    if (!relatedSubs) return [];
    return relatedSubs.filter(sub => sub.id !== id && sub.isAddOnEnabled);
  }, [relatedSubs, id]);

  // Pricing Logic
  const basePrice = baseService?.basePrice || baseService?.price || 0;
  const addOnsTotal = addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0);
  const platformFee = 50;
  const totalPrice = basePrice + addOnsTotal + platformFee;

  const toggleAddOn = (subId: string) => {
    setSelectedAddOnIds(prev => prev.includes(subId) ? prev.filter(i => i !== subId) : [...prev, id === subId ? '' : subId].filter(Boolean));
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

  if (!mounted || mainLoading || subLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!baseService) return <div className="p-20 text-center uppercase font-black text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8F9FA] min-h-screen pb-24">
        
        {/* MAIN SECTION: SERVICE & ADD-ONS */}
        <section className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Service & Add-ons</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 1. MAIN SERVICE CARD */}
            <div className="lg:col-span-4">
              <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl bg-white sticky top-24">
                <div className="relative aspect-video w-full bg-gray-900 flex items-center justify-center">
                  {baseService.imageUrl ? (
                    <Image src={baseService.imageUrl} alt="Service" fill className="object-cover" unoptimized />
                  ) : (
                    <Zap size={48} className="text-primary" />
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                      <Check size={12} strokeWidth={4} /> Selected
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                      {baseService.title || baseService.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-[#D60000]">৳{basePrice.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">incl materials</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    {baseService.description || "Complete professional treatment for your selected category. Standard procedures applied."}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Products Included", "Insured Pros", "Checklist", "Disposal"].map((badge, i) => (
                      <Badge key={i} variant="secondary" className="bg-[#FAF3E0] text-[#8B4513] border-none text-[8px] font-black uppercase px-2 py-1">
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-6 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg">
                      <Star size={12} fill="#FFD700" className="text-[#FFD700]" />
                      <span className="text-[10px] font-black tracking-widest">{baseService.rating || '4.8'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{baseService.teamSize || '2 Professionals'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 2. ADD-ONS LIST */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">+ Enhance Your Service</h4>
              </div>
              
              <div className="space-y-3">
                {addOnOptions.map((addon) => (
                  <div 
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.id)}
                    className={cn(
                      "group p-4 md:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white",
                      selectedAddOnIds.includes(addon.id) ? "border-[#D60000] bg-red-50/30" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                      selectedAddOnIds.includes(addon.id) ? "bg-[#D60000] border-[#D60000] text-white" : "border-gray-200"
                    )}>
                      {selectedAddOnIds.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                      {addon.imageUrl ? (
                        <Image src={addon.imageUrl} alt="Icon" width={24} height={24} className="object-contain" unoptimized />
                      ) : (
                        <Sparkles size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{addon.name}</h5>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{addon.description || 'Extra treatment for surface shine.'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn("text-sm font-black", selectedAddOnIds.includes(addon.id) ? "text-[#D60000]" : "text-gray-900")}>
                        +৳{addon.price}
                      </span>
                    </div>
                  </div>
                ))}
                {addOnOptions.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20 italic">No add-ons available for this service.</div>
                )}
              </div>
            </div>

            {/* 3. ORDER SUMMARY (STICKY) */}
            <div className="lg:col-span-3 lg:sticky lg:top-24">
              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white">
                <div className="bg-[#081621] p-6 text-white flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest">Order Summary</h3>
                  <div className="w-6 h-6 rounded-full bg-[#D60000] flex items-center justify-center text-[10px] font-black">
                    {selectedAddOnIds.length + 1}
                  </div>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                    {/* Base Service in Summary */}
                    <div className="flex justify-between items-start gap-4 group">
                      <div className="p-2 bg-gray-50 rounded-xl"><Wrench size={16} className="text-gray-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-gray-900 uppercase truncate">{baseService.title || baseService.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{baseService.duration || '2-4 Hours'}</p>
                      </div>
                      <span className="text-sm font-black text-gray-900">৳{basePrice.toLocaleString()}</span>
                    </div>

                    {/* Selected Add-ons in Summary */}
                    {addOnOptions.filter(a => selectedAddOnIds.includes(a.id)).map(addon => (
                      <div key={addon.id} className="flex justify-between items-start gap-4 animate-in slide-in-from-right-4">
                        <div className="p-2 bg-gray-50 rounded-xl"><Sparkles size={16} className="text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-gray-900 uppercase truncate">{addon.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Add-on Service</p>
                        </div>
                        <span className="text-sm font-black text-gray-900">৳{addon.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-dashed space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Base Service</span>
                      <span className="text-gray-900">৳{basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Add-ons ({selectedAddOnIds.length})</span>
                      <span className="text-gray-900">৳{addOnsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Platform fee</span>
                      <span className="text-gray-900">৳{platformFee}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-gray-900 flex justify-between items-end">
                    <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Total</span>
                    <span className="text-3xl font-black text-[#D60000] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Button onClick={handleContinue} className="w-full h-14 rounded-2xl bg-[#D60000] hover:bg-[#B50000] text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20 gap-2">
                      <ArrowRight size={18} /> Continue to Checkout
                    </Button>
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-50">
                      Save for Later
                    </Button>
                  </div>

                  <div className="flex justify-center gap-4 pt-4 opacity-40">
                    <div className="flex items-center gap-1.5"><Shield size={12} /> <span className="text-[8px] font-black uppercase">Secure</span></div>
                    <div className="flex items-center gap-1.5"><BadgeCheck size={12} /> <span className="text-[8px] font-black uppercase">Verified</span></div>
                    <div className="flex items-center gap-1.5"><RefreshCcw size={12} /> <span className="text-[8px] font-black uppercase">Free Cancel</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION: BEFORE & AFTER */}
        <section className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Before & After</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-8">
            <div className="flex gap-2 p-1 bg-gray-200 w-fit rounded-full">
              {['all', 'before', 'after'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBeforeAfterTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all",
                    beforeAfterTab === tab ? "bg-black text-white shadow-lg" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden bg-gray-200 shadow-inner group">
              <Image src="https://picsum.photos/seed/clean-home/1200/800" alt="Work Sample" fill className="object-cover" unoptimized />
              <div className="absolute top-6 left-6">
                <Badge className="bg-black/60 backdrop-blur-md text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                  <Camera size={12} className="mr-2" /> {beforeAfterTab === 'all' ? 'Work Case' : beforeAfterTab}
                </Badge>
              </div>
              <div className="absolute inset-y-0 left-6 flex items-center">
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"><ArrowLeft size={20}/></button>
              </div>
              <div className="absolute inset-y-0 right-6 flex items-center">
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"><ArrowRight size={20}/></button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={cn("relative aspect-square rounded-2xl overflow-hidden border-4 cursor-pointer transition-all", i === 0 ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}>
                  <Image src={`https://picsum.photos/seed/thumb${i}/200/200`} alt="Thumbnail" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: SPECIAL NOTES */}
        <section className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Special Notes</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4 text-gray-400">
                <MessageSquare size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Instructions for professional</span>
              </div>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please bring extra gloves. Focus on kitchen tiles..."
                className="min-h-[120px] bg-gray-50 border-none rounded-2xl p-6 text-sm font-medium focus:bg-white transition-all shadow-inner"
              />
            </CardContent>
          </Card>
        </section>

        {/* MOBILE STICKY BAR */}
        {!isCheckoutOpen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-gray-100 p-4 pb-safe-offset-4 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Due</span>
              <span className="text-2xl font-black text-[#D60000] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinue}
              className="flex-1 h-14 rounded-xl bg-[#D60000] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20"
            >
              Book Now <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}

      </div>
    </PublicLayout>
  );
}
