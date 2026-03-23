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
    } as any);
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

  if (!mounted || sLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!service) return <div className="p-20 text-center font-black uppercase text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-32 lg:pb-12">
        <div className="container mx-auto px-0 md:px-4 lg:py-10 max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* COLUMN 1: Visuals (Left) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white relative rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                <div className="relative aspect-square w-full">
                  {allImages.length > 0 ? (
                    <Image src={allImages[activeImageIdx]} alt={service.title} fill className="object-cover transition-opacity duration-500" priority unoptimized />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/40"><Wrench size={80} /></div>
                  )}
                  
                  {/* Badges TOP-LEFT */}
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
                          "relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                          activeImageIdx === idx ? "border-primary" : "border-transparent"
                        )}
                      >
                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPACT What's Included (MOVED HERE) */}
              {includedItems && includedItems.length > 0 && (
                <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3 border-gray-50">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><ListChecks size={14} /></div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-[#081621]">What's Included</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {includedItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-2.5 group">
                          <CheckCircle2 size={12} className="text-accent mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] font-bold text-gray-600 leading-tight uppercase tracking-tight">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* COLUMN 2: Details & Selection (Middle) */}
            <div className="lg:col-span-5 space-y-8 px-4 lg:px-0">
              {/* Service Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-black text-[#081621] tracking-tighter uppercase leading-tight">{service.title}</h1>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-md w-fit">
                    {service.categoryId || 'Premium Service'}
                  </Badge>
                </div>

                {/* Info Row (Single Line) */}
                <div className="flex flex-wrap items-center gap-3 py-2">
                  <div className="flex items-center gap-1.5 text-gray-700 bg-white shadow-sm px-4 py-2 rounded-xl text-[11px] font-black border border-gray-100 uppercase">
                    <Star size={14} fill="#f59e0b" className="text-amber-400" /> {service.rating || '5.0'}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700 bg-white shadow-sm px-4 py-2 rounded-xl text-[11px] font-black border border-gray-100 uppercase">
                    <Clock size={14} className="text-primary" /> {service.duration || '2-4 Hours'}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700 bg-white shadow-sm px-4 py-2 rounded-xl text-[11px] font-black border border-gray-100 uppercase">
                    <Users size={14} className="text-blue-500" /> {service.teamSize || '2-3 Members'}
                  </div>
                </div>
              </div>

              {/* Package Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl"><Package size={18} /></div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#081621]">Select Package</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {pkgLoading ? <Loader2 className="animate-spin text-primary" /> : packages?.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={cn(
                        "relative p-6 rounded-3xl border-2 transition-all cursor-pointer group active:scale-[0.98] flex items-center justify-between",
                        selectedPkgId === pkg.id ? "border-primary bg-primary/5 shadow-inner" : "border-gray-100 bg-white hover:border-gray-200"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{pkg.name}</p>
                          {pkg.isRecommended && <Badge className="bg-amber-500 border-none font-black text-[8px] uppercase px-2">Most Popular</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{pkg.areaSize}</p>
                      </div>
                      <p className="text-xl font-black text-primary">৳{pkg.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-on Services */}
              {addOns && addOns.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 text-accent rounded-xl"><Zap size={18} fill="currentColor" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-[#081621]">Add-on Services</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addOns.map((add) => (
                      <div 
                        key={add.id} 
                        onClick={() => setSelectedAddOnIds(prev => prev.includes(add.id) ? prev.filter(i => i !== add.id) : [...prev, add.id])}
                        className={cn(
                          "p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white group active:scale-95 flex items-center justify-between",
                          selectedAddOnIds.includes(add.id) ? "border-accent bg-accent/5 shadow-inner" : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", selectedAddOnIds.includes(add.id) ? "bg-accent text-white" : "bg-gray-50 text-gray-400")}>
                            <Zap size={18} fill="currentColor" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-[11px] uppercase truncate">{add.name}</p>
                            <p className="font-black text-xs text-accent">+৳{add.price}</p>
                          </div>
                        </div>
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", selectedAddOnIds.includes(add.id) ? "bg-accent border-accent text-white" : "border-gray-200 text-gray-200")}>
                          <Plus size={14} strokeWidth={3} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 3: Summary (Right) */}
            <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
              <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white border-t-8 border-primary">
                <div className="p-8 space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-[#081621]">Booking Summary</h3>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Pricing Overview</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tight">
                      <span>{selectedPkg?.name || 'Base Service'}</span>
                      <span className="text-gray-900">৳{selectedPkg?.price?.toLocaleString() || '0'}</span>
                    </div>
                    
                    {selectedAddOnIds.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-50">
                        {addOns?.filter(a => selectedAddOnIds.includes(a.id)).map(a => (
                          <div key={a.id} className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                            <span>+ {a.name}</span>
                            <span className="text-accent font-black">৳{a.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-6 border-t-2 border-dashed border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Price</span>
                        <span className="text-4xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Badge className="bg-accent text-white border-none font-black text-[8px] px-3 py-1 rounded-full uppercase">VAT Included</Badge>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600">
                          <ShieldCheck size={12} /> Secure
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleContinueBooking} 
                    className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-accent/20 uppercase tracking-tight gap-3 transition-transform active:scale-95 bg-accent hover:bg-accent/90 text-white"
                  >
                    Book Now <ChevronRight size={20} />
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* BOTTOM SECTIONS (Full Width) */}
          <div className="mt-16 space-y-16">
            
            {/* Description Section */}
            <section className="px-4 lg:px-0">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#081621]">Service Overview</h2>
                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed font-medium">
                  <p className="whitespace-pre-line">{service.description}</p>
                </div>
              </div>
            </section>

            {/* Customer Reviews */}
            {reviews && reviews.length > 0 && (
              <section className="px-4 lg:px-0 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#081621] flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Star size={24} fill="currentColor" /></div> Customer Feedback
                  </h2>
                  <Button variant="outline" className="rounded-full font-black text-[10px] uppercase">All Reviews</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm">{rev.name?.[0]}</div>
                          <div>
                            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{rev.name}</span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Verified Client</p>
                          </div>
                        </div>
                        <div className="flex text-amber-400 gap-0.5 bg-amber-50 px-3 py-1 rounded-full">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "text-amber-400" : "text-gray-200"} />)}
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium italic leading-relaxed text-sm">"{rev.text}"</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10">
          <div className="bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-2 pl-8 flex items-center justify-between h-[76px]">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Payble</span>
              <span className="text-2xl font-black text-primary tracking-tighter">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinueBooking} 
              className="h-14 px-8 rounded-full font-black text-xs uppercase shadow-xl bg-accent text-white gap-2 transition-all active:scale-90 border-none"
            >
              Book Now <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
