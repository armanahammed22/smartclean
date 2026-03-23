
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
  Truck,
  Info,
  CalendarCheck,
  Users
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

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

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

  if (!mounted || sLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!service) return <div className="p-20 text-center font-black uppercase text-gray-300">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-32 lg:pb-12">
        <div className="container mx-auto px-0 md:px-4 lg:py-8 max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* COLUMN 1: Visuals & Info */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* HERO SECTION */}
              <div className="relative aspect-[4/3] md:aspect-[21/9] lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-900">
                {service.imageUrl ? (
                  <Image src={service.imageUrl} alt={service.title} fill className="object-cover" priority unoptimized />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/40"><Wrench size={80} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">
                    {service.categoryId || 'Premium'}
                  </Badge>
                  {service.isPopular && (
                    <Badge className="bg-amber-500 text-white border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">Most Popular</Badge>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-4">
                  <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight drop-shadow-md">{service.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 uppercase"><Star size={12} fill="currentColor" /> {service.rating || '5.0'}</div>
                    <div className="flex items-center gap-1 text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 uppercase"><Clock size={12} /> {service.duration || 'Variable'}</div>
                    {service.teamSize && <div className="flex items-center gap-1 text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 uppercase"><Users size={12} /> {service.teamSize}</div>}
                  </div>
                </div>
              </div>

              {/* PACKAGE SELECTOR */}
              <div className="px-4 lg:px-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#081621] flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Package size={18} /></div> Select Package
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pkgLoading ? <div className="col-span-full text-center py-10"><Loader2 className="animate-spin inline" /></div> : packages?.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={cn(
                        "relative p-6 rounded-3xl border-2 transition-all cursor-pointer group active:scale-95",
                        selectedPkgId === pkg.id ? "border-primary bg-primary/5 shadow-inner" : "border-gray-100 bg-white"
                      )}
                    >
                      {pkg.isRecommended && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 border-none font-black text-[8px] uppercase">Highly Recommended</Badge>}
                      <div className="space-y-1">
                        <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{pkg.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{pkg.areaSize}</p>
                        <p className="text-xl font-black text-primary mt-2">৳{pkg.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD-ONS */}
              {addOns && addOns.length > 0 && (
                <div className="px-4 lg:px-0 space-y-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#081621] flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Zap size={18} fill="currentColor" /></div> Add-on Tasks
                  </h2>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {addOns.map((add) => (
                      <div 
                        key={add.id}
                        onClick={() => setSelectedAddOnIds(prev => prev.includes(add.id) ? prev.filter(i => i !== add.id) : [...prev, add.id])}
                        className={cn(
                          "min-w-[160px] p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white group active:scale-95",
                          selectedAddOnIds.includes(add.id) ? "border-emerald-500 bg-emerald-50/30" : "border-gray-100"
                        )}
                      >
                        <div className="space-y-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", selectedAddOnIds.includes(add.id) ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400")}>
                            <Zap size={16} fill="currentColor" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 text-[11px] uppercase truncate">{add.name}</p>
                            <p className="font-black text-xs text-emerald-600">+৳{add.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WHAT'S INCLUDED */}
              {includedItems && includedItems.length > 0 && (
                <div className="px-4 lg:px-0">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-black uppercase tracking-widest text-[#081621] flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ListChecks size={18} /></div> Service Checklist
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                      {includedItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="p-1 bg-green-50 text-green-600 rounded-full shrink-0"><CheckCircle2 size={14} /></div>
                          <span className="text-[13px] font-medium text-gray-600 uppercase tracking-tight">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* REVIEWS */}
              {reviews && reviews.length > 0 && (
                <div className="px-4 lg:px-0 space-y-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#081621] flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} fill="currentColor" /></div> Real Feedback
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-6 rounded-[2rem] border border-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">{rev.name?.[0]}</div>
                            <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{rev.name}</span>
                          </div>
                          <div className="flex text-amber-400 gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                          </div>
                        </div>
                        <p className="text-[13px] text-gray-600 font-medium italic leading-relaxed">"{rev.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Booking Intelligence (Desktop) */}
            <div className="hidden lg:block lg:col-span-5 space-y-6 sticky top-24">
              <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white border-t-8 border-primary">
                <div className="p-10 space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#081621]">Booking Summary</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Dynamic Price Configuration</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                      <span>Selected Tier</span>
                      <span className="text-gray-900">{selectedPkg?.name || 'Base Service'}</span>
                    </div>
                    
                    {selectedAddOnIds.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                          <span>Add-ons Volume</span>
                          <span className="text-emerald-600 font-black">+৳{addOns?.filter(a => selectedAddOnIds.includes(a.id)).reduce((acc, a) => acc + (a.price || 0), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><ShieldCheck size={18} /></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Premium Promise</p>
                        <p className="text-[11px] font-medium text-blue-700/70">Verified experts with eco-friendly cleaning solutions.</p>
                      </div>
                    </div>

                    <div className="pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Payble</span>
                        <span className="text-5xl font-black text-[#081621] tracking-tighter italic">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black text-[10px] px-4 py-1.5 rounded-full">VAT INC.</Badge>
                    </div>
                  </div>

                  <Button 
                    onClick={handleContinueBooking} 
                    className="w-full h-20 rounded-2xl font-black text-xl shadow-2xl shadow-primary/20 uppercase tracking-tight gap-3 transition-transform active:scale-95 bg-primary hover:bg-primary/90"
                  >
                    Confirm & Schedule <CalendarCheck size={24} />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* MOBILE FLOATING BAR */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10">
          <div className="bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-2 pl-8 flex items-center justify-between h-[76px]">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Price</span>
              <span className="text-2xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinueBooking} 
              className="h-14 px-8 rounded-full font-black text-xs uppercase shadow-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white gap-2 transition-all active:scale-90 border-none"
            >
              Book Now <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
