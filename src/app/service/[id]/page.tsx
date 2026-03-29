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
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

  const addOnOptions = useMemo(() => {
    if (!relatedSubs) return [];
    return relatedSubs.filter(sub => sub.id !== id && sub.isAddOnEnabled);
  }, [relatedSubs, id]);

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
          <div className="bg-white lg:rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col lg:grid lg:grid-cols-12">
            
            <div className="lg:col-span-4 p-6 md:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border shadow-inner">
                {baseService.imageUrl ? (
                  <Image src={baseService.imageUrl} alt="Service" fill className="object-cover" unoptimized />
                ) : (
                  <Wrench size={48} className="text-gray-200" />
                )}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary/90 backdrop-blur-md text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm">Featured Service</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-[#081621] uppercase tracking-tight font-headline">{baseService.title || baseService.name}</h1>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= (baseService.rating || 5) ? "currentColor" : "none"} />)}
                    </div>
                    <span className="text-[10px] font-black text-gray-400">({baseService.rating || '5.0'})</span>
                  </div>
                </div>

                <div className="text-2xl font-black text-[#D60000]">৳{basePrice.toLocaleString()}</div>
                
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {baseService.description || "Get expert treatment from our certified technicians. We ensure safety and quality in every job."}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <Clock size={14} className="text-primary" /> {baseService.duration || '2-4 Hours'}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <Users size={14} className="text-primary" /> {baseService.teamSize || 'Professional'}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 md:p-8 space-y-8 bg-gray-50/30 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Extra Treatments</h3>
                <Badge variant="secondary" className="bg-white border text-[8px] font-black uppercase">Optional</Badge>
              </div>

              <div className="space-y-3">
                {addOnOptions.map((addon) => (
                  <div 
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.id)}
                    className={cn(
                      "group p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white hover:shadow-md",
                      selectedAddOnIds.includes(addon.id) ? "border-primary ring-1 ring-primary/10" : "border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                      selectedAddOnIds.includes(addon.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                    )}>
                      {selectedAddOnIds.includes(addon.id) && <Check size={14} strokeWidth={4} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] md:text-xs font-black text-gray-900 uppercase truncate tracking-tight">{addon.name}</h5>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">+৳{addon.price}</p>
                    </div>
                    {addon.imageUrl && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border">
                        <Image src={addon.imageUrl} alt="Addon" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                ))}
                {addOnOptions.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed rounded-2xl opacity-20 italic font-bold uppercase text-[10px] tracking-widest">No add-ons available.</div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Technician Note (Optional)</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please bring extra chemicals for deep rust."
                  className="min-h-[100px] bg-white border-gray-200 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="lg:col-span-3 p-6 md:p-8 flex flex-col bg-white">
              <div className="space-y-6 flex-1">
                <div className="pb-4 border-b">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Summary</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Base Charge</span>
                    <span className="text-gray-900">৳{basePrice.toLocaleString()}</span>
                  </div>
                  {selectedAddOnIds.length > 0 && (
                    <div className="flex justify-between text-xs font-bold text-blue-600 uppercase animate-in slide-in-from-top-1">
                      <span>Add-ons Total</span>
                      <span>+৳{addOnsTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Service Fee</span>
                    <span className="text-gray-900">৳{platformFee}</span>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-100 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Grand Total</span>
                  <span className="text-4xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                </div>

                <div className="space-y-3 pt-4">
                  <Button onClick={handleContinue} className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
                    Book Service Now <ArrowRight size={18} />
                  </Button>
                  <p className="text-[8px] text-center text-muted-foreground font-black uppercase tracking-[0.2em]">Satisfaction Guaranteed</p>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Shield size={16} /></div>
                  <span className="text-[10px] font-black uppercase text-gray-600">Verified Technicians</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BadgeCheck size={16} /></div>
                  <span className="text-[10px] font-black uppercase text-gray-600">Cash After Service</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="container mx-auto px-0 md:px-4 py-8 md:py-12 max-w-7xl">
          <div className="bg-white lg:rounded-xl overflow-hidden shadow-sm border border-gray-100 p-6 md:p-10 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
              <div>
                <h2 className="text-2xl font-black text-[#081621] uppercase tracking-tighter italic">Results Gallery</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Real proof of our work quality</p>
              </div>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full w-fit">
                {['all', 'before', 'after'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBeforeAfterTab(tab)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all",
                      beforeAfterTab === tab ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-gray-900"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border shadow-inner">
                <Image src="https://picsum.photos/seed/service-result/1200/800" alt="Work Sample" fill className="object-cover" unoptimized />
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-black/60 backdrop-blur-md text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                    <Camera size={12} className="mr-2" /> Current Case
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-[400px] no-scrollbar">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition-all">
                    <Image src={`https://picsum.photos/seed/case${i}/400/300`} alt="Thumbnail" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

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
