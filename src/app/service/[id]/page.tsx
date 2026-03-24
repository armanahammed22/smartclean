"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  Zap,
  Star,
  CheckCircle2,
  ChevronRight,
  Wrench,
  Users,
  Package,
  ListChecks,
  Volume2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { cn } from '@/lib/utils';
import { generateProductSpeech } from '@/ai/flows/tts-flow';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Service Data
  const serviceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: sLoading } = useDoc(serviceRef);

  // Fetch Sub-data
  const pkgQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'packages'), orderBy('price', 'asc')) : null, [db, id]);
  const addonsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'addOns'), orderBy('name', 'asc')) : null, [db, id]);
  const includedQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'includedItems'), orderBy('title', 'asc')) : null, [db, id]);
  const reviewsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'reviews'), orderBy('createdAt', 'desc')) : null, [db, id]);

  const { data: packages, isLoading: pkgLoading } = useCollection(pkgQuery);
  const { data: addOns, isLoading: addOnLoading } = useCollection(addonsQuery);
  const { data: includedItems } = useCollection(includedQuery);
  const { data: reviews } = useCollection(reviewsQuery);

  // Auto-select recommended package
  useEffect(() => {
    if (packages && packages.length > 0 && !selectedPkgId) {
      const recommended = packages.find(p => p.isRecommended) || packages[0];
      setSelectedPkgId(recommended.id);
    }
  }, [packages, selectedPkgId]);

  const selectedPkg = useMemo(() => packages?.find(p => p.id === selectedPkgId), [packages, selectedPkgId]);
  
  const totalPrice = useMemo(() => {
    const pkgPrice = selectedPkg?.price || service?.basePrice || 0;
    const addOnPrice = addOns?.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0) || 0;
    return pkgPrice + addOnPrice;
  }, [service, selectedPkg, addOns, selectedAddOnIds]);

  const handleContinueBooking = () => {
    if (!service) return;
    const chosenAddOns = addOns?.filter(a => selectedAddOnIds.includes(a.id)) || [];
    const combinedTitle = `${service.title} - ${selectedPkg?.name || 'Standard'}${chosenAddOns.length > 0 ? ` (+${chosenAddOns.map(a => a.name).join(', ')})` : ''}`;

    addToCart({
      ...service,
      title: combinedTitle,
      basePrice: totalPrice,
    } as any, 1, false);
    setCheckoutOpen(true);
  };

  const handleSpeak = async () => {
    if (!service || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const text = `${service.title}. Category ${service.categoryId || 'Professional Cleaning'}. Price starts from ${service.basePrice} BDT. ${service.shortDescription || ''}`;
      const url = await generateProductSpeech(text);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setIsSpeaking(false);
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const allImages = useMemo(() => {
    if (!service) return [];
    const images = [service.imageUrl];
    if (service.galleryImages?.length) {
      images.push(...service.galleryImages);
    }
    return images.filter(img => !!img);
  }, [service]);

  if (!mounted || sLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!service) return <div className="p-20 text-center font-black uppercase text-gray-300 bg-[#F8FAFC]">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-32 lg:pb-12">
        <div className="container mx-auto px-0 md:px-4 lg:py-10 max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* COLUMN 1: Sidebar (Left) - Images & Included */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white relative rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
                <div className="relative aspect-square w-full">
                  {allImages.length > 0 ? (
                    <Image src={allImages[activeImageIdx]} alt={service.title} fill className="object-cover transition-opacity duration-500" priority unoptimized />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/40"><Wrench size={80} /></div>
                  )}
                  
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {service.isPopular && (
                      <Badge className="bg-amber-500 text-white border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-md flex items-center gap-1">
                        <Star size={10} fill="white" /> Most Popular
                      </Badge>
                    )}
                    {selectedPkg?.isRecommended && (
                      <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-md flex items-center gap-1">
                        <CheckCircle2 size={10} /> Recommended
                      </Badge>
                    )}
                  </div>

                  <button 
                    onClick={handleSpeak}
                    className={cn(
                      "absolute bottom-4 left-4 p-3 rounded-full bg-white/90 shadow-lg border border-gray-100 transition-transform active:scale-90",
                      isSpeaking && "animate-pulse ring-2 ring-primary"
                    )}
                  >
                    {isSpeaking ? <Loader2 className="animate-spin text-primary" size={20} /> : <Volume2 className="text-primary" size={20} />}
                  </button>
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-4 bg-white no-scrollbar border-t border-gray-50">
                    {allImages.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={cn(
                          "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                          activeImageIdx === idx ? "border-primary" : "border-transparent"
                        )}
                      >
                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* What is Included */}
              {includedItems && includedItems.length > 0 && (
                <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3 border-gray-100">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><ListChecks size={14} /></div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">What is Included</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {includedItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 group">
                          <CheckCircle2 size={12} className="text-accent mt-0.5 shrink-0" />
                          <span className="text-[10px] font-bold text-gray-600 leading-tight uppercase tracking-tight">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* COLUMN 2: Identity & Sequential Selection (Middle) */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-black text-[#081621] tracking-tighter uppercase leading-none">{service.title}</h1>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{service.categoryId || 'General Service'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-1.5 text-gray-700 text-[10px] font-black uppercase">
                    <Star size={14} fill="#f59e0b" className="text-amber-400" /> {service.rating || '5.0'} Rating
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700 text-[10px] font-black uppercase">
                    <Clock size={14} className="text-primary" /> {service.duration || '2-4 Hours'}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700 text-[10px] font-black uppercase">
                    <Users size={14} className="text-blue-500" /> {service.teamSize || '2-3 Staff'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1: Package List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg font-black text-[9px]">STEP 1</div>
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">Choose Package</h2>
                  </div>
                  <div className="space-y-3">
                    {pkgLoading ? <Loader2 className="animate-spin text-primary mx-auto" /> : packages?.map((pkg) => (
                      <div 
                        key={pkg.id} 
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white group active:scale-[0.98]",
                          selectedPkgId === pkg.id ? "border-primary bg-primary/5 shadow-sm" : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-black text-gray-900 uppercase text-[10px] tracking-tight">{pkg.name}</p>
                          {pkg.isRecommended && <Badge className="text-[7px] bg-primary h-4 px-1.5">POPULAR</Badge>}
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[8px] text-muted-foreground font-bold uppercase">{pkg.areaSize}</p>
                          <p className="text-sm font-black text-primary">৳{pkg.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Add-on List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="p-1.5 bg-accent/10 text-accent rounded-lg font-black text-[9px]">STEP 2</div>
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">Add On Service</h2>
                  </div>
                  <div className="space-y-3">
                    {addOnLoading ? <Loader2 className="animate-spin text-primary mx-auto" /> : addOns?.map((add) => (
                      <div 
                        key={add.id} 
                        onClick={() => setSelectedAddOnIds(prev => prev.includes(add.id) ? prev.filter(i => i !== add.id) : [...prev, add.id])}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white group active:scale-[0.98] flex items-center justify-between",
                          selectedAddOnIds.includes(add.id) ? "border-accent bg-accent/5 shadow-sm" : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-[10px] uppercase truncate">{add.name}</p>
                          <p className="font-black text-[10px] text-accent mt-0.5">+৳{add.price}</p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedAddOnIds.includes(add.id) ? "bg-accent border-accent text-white" : "border-gray-200 text-gray-200"
                        )}>
                          <Plus size={14} strokeWidth={3} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: Booking Summary (Desktop) */}
            <div className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24">
              <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white border-t-8 border-primary">
                <CardContent className="p-8 space-y-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-[#081621]">Booking Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tight">
                      <span>{selectedPkg?.name || 'Base Package'}</span>
                      <span className="text-gray-900">৳{selectedPkg?.price?.toLocaleString() || '0'}</span>
                    </div>
                    {selectedAddOnIds.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        {addOns?.filter(a => selectedAddOnIds.includes(a.id)).map(a => (
                          <div key={a.id} className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                            <span>+ {a.name}</span>
                            <span className="text-accent font-black">৳{a.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-6 border-t-2 border-dashed border-gray-100">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Payable</p>
                      <p className="text-4xl font-black text-[#081621] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button onClick={handleContinueBooking} className="w-full h-16 rounded-2xl font-black text-lg shadow-xl bg-accent hover:bg-accent/90 text-white uppercase tracking-tight gap-3">
                    Confirm Booking <ChevronRight size={20} />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR (Global nav buttons hidden) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-[100] flex items-center h-20 px-3 gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe-offset-2">
          <div className="flex flex-col min-w-[70px]">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Payable</span>
            <span className="text-xl font-black text-primary tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
          </div>
          <Button 
            onClick={handleContinueBooking} 
            className="flex-1 h-11 rounded-lg font-black text-[10px] uppercase shadow-xl bg-accent text-white gap-2 border-none whitespace-nowrap tracking-tighter"
          >
            Book Now <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
