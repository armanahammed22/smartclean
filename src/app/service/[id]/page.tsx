
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
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Service Data
  const serviceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: serviceLoading } = useDoc(serviceRef);

  // Fetch Linked Sub-Services
  const subServicesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', id), where('status', '==', 'Active'));
  }, [db, id]);
  const { data: subServices, isLoading: subLoading } = useCollection(subServicesQuery);

  // Fetch Delivery/Base Charges
  const deliveryQuery = useMemoFirebase(() => db ? query(collection(db, 'delivery_options'), where('isEnabled', '==', true), orderBy('amount', 'asc')) : null, [db]);
  const { data: deliveryOptions } = useCollection(deliveryQuery);

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

  if (!mounted || serviceLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!service) return <div className="p-20 text-center font-bold text-muted-foreground">Service Not Found</div>;

  return (
    <PublicLayout minimalMobile={true}>
      <div className="bg-[#F8FAFC] min-h-screen pb-32 lg:pb-12">
        <div className="container mx-auto px-0 md:px-4 lg:py-8 max-w-7xl">
          
          <Button variant="ghost" onClick={() => router.back()} className="hidden lg:flex mb-6 gap-2 rounded-full hover:bg-white shadow-sm transition-all text-gray-500 font-bold">
            <ArrowLeft size={18} /> {t('back_to_list')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* COLUMN 1: Service Media & Description */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* HERO SECTION - Immersive Mobile Design */}
              <div className="relative aspect-[4/3] md:aspect-[21/9] lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-900 group">
                {service.imageUrl ? (
                  <Image 
                    src={service.imageUrl} 
                    alt={service.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/40">
                    <Wrench size={80} />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Top Badge */}
                <div className="absolute top-6 left-6">
                  <Badge className="bg-primary/90 backdrop-blur-md text-white border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg">
                    {service.categoryId || 'Premium'}
                  </Badge>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-4">
                  <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight drop-shadow-md">
                    {service.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 uppercase">
                      <Star size={12} fill="currentColor" /> 5.0
                    </div>
                    <div className="flex items-center gap-1 text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 uppercase">
                      <Clock size={12} /> {service.duration || '2-4h'}
                    </div>
                    <div className="flex items-center gap-1 text-green-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 uppercase">
                      <ShieldCheck size={12} /> Certified
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-0 space-y-6">
                {/* Description Card */}
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#081621] flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Info size={18} /></div> Service Scope
                  </h2>
                  <div className="text-sm md:text-base text-gray-600 font-medium leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-6">
                    {service.description}
                  </div>
                </div>

                {/* Sub-Services Grid */}
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-widest text-[#081621] flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Zap size={18} fill="currentColor" /></div> Add-on Tasks
                    </h2>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 font-black text-[9px] px-2.5 py-1 rounded-lg">
                      {subServices?.length || 0} OPTIONS
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                    {subLoading ? (
                      <div className="col-span-full py-10 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
                    ) : subServices?.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={cn(
                          "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white group active:scale-95",
                          selectedSubIds.includes(sub.id) ? "border-primary bg-primary/5 shadow-inner" : "border-gray-50 hover:border-gray-200"
                        )}
                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                            selectedSubIds.includes(sub.id) ? "bg-primary border-primary" : "border-gray-200"
                          )}>
                            {selectedSubIds.includes(sub.id) && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 text-[13px] uppercase leading-tight">{sub.name}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                              <Clock size={10} /> {sub.duration}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-primary">৳{sub.price}</span>
                        </div>
                      </div>
                    ))}
                    {!subServices?.length && !subLoading && (
                      <div className="col-span-full py-10 text-center text-muted-foreground bg-gray-50/50 rounded-2xl border border-dashed italic text-sm">
                        No additional tasks currently available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Booking Summary (Desktop) */}
            <div className="hidden lg:block lg:col-span-5 space-y-6 sticky top-24">
              <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white border-t-8 border-primary">
                <CardHeader className="p-10 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter text-[#081621]">Order Summary</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Transparent Pricing breakdown</p>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-6 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                      <span>Base Service Fee</span>
                      <span className="text-gray-900">৳{service.basePrice.toLocaleString()}</span>
                    </div>
                    
                    {selectedSubIds.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                          <span>Add-ons Selection</span>
                          <span className="text-primary font-black">+৳{addonsTotal.toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                          {subServices?.filter(s => selectedSubIds.includes(s.id)).map(s => (
                            <div key={s.id} className="flex justify-between text-[11px] font-bold text-gray-600 uppercase">
                              <span>• {s.name}</span>
                              <span>৳{s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Truck size={18} /></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Logistic Surcharge</p>
                        <p className="text-[11px] font-medium text-blue-700/70">Applicable based on your verified service area at checkout.</p>
                      </div>
                    </div>

                    <div className="pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Payble</span>
                        <span className="text-5xl font-black text-[#081621] tracking-tighter italic">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black text-[10px] px-4 py-1.5 rounded-full shadow-lg">VAT INC.</Badge>
                    </div>
                  </div>

                  <Button 
                    onClick={handleContinueBooking} 
                    className="w-full h-20 rounded-2xl font-black text-xl shadow-2xl shadow-primary/20 uppercase tracking-tight gap-3 transition-transform active:scale-95 bg-primary hover:bg-primary/90"
                  >
                    Proceed to Schedule <CalendarCheck size={24} />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* MOBILE FLOATING BOOKING BAR - Premium UX */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-2 pl-8 flex items-center justify-between h-[72px]">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                <span className="text-[8px] font-black text-green-600 uppercase">VAT+</span>
              </div>
            </div>
            <Button 
              onClick={handleContinueBooking} 
              className="h-14 px-8 rounded-full font-black text-xs uppercase shadow-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white gap-2 transition-all active:scale-90 border-none"
            >
              Book Now <ChevronRight size={18} className="animate-pulse" />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
