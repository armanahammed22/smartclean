
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
      <div className="bg-[#F8FAFC] min-h-screen pb-24 lg:pb-12">
        <div className="container mx-auto px-4 py-4 md:py-8">
          
          <Button variant="ghost" onClick={() => router.back()} className="hidden lg:flex mb-6 gap-2 rounded-full hover:bg-white shadow-sm transition-all text-gray-500 font-bold">
            <ArrowLeft size={18} /> {t('back_to_list')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* COLUMN 1: Service Media & Description */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl bg-gray-200 border-4 border-white group">
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
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/40">
                    <Wrench size={80} />
                  </div>
                )}
                <div className="absolute top-4 left-4 md:top-8 md:left-8">
                  <Badge className="bg-primary text-white border-none px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl">
                    {service.categoryId || 'Premium Service'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-tight">{service.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1 rounded-full"><Star size={14} fill="currentColor" /> 5.0 Rating</div>
                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1 rounded-full"><Clock size={14} /> {service.duration || '2-4 Hours'}</div>
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full"><ShieldCheck size={14} /> Certified Staff</div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Info size={20} className="text-primary" /></div> Service Details
                  </h2>
                  <div className="text-sm md:text-base text-gray-600 font-medium leading-relaxed whitespace-pre-wrap border-t pt-6">
                    {service.description}
                  </div>
                </div>

                {/* Additional Tasks Selection */}
                <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Zap size={20} fill="currentColor" className="text-primary" /></div> Add-on Services
                    </h2>
                    <Badge variant="outline" className="uppercase font-black text-[9px] tracking-widest">{subServices?.length || 0} Options</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
                    {subLoading ? (
                      <div className="col-span-full py-10 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
                    ) : subServices?.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white group",
                          selectedSubIds.includes(sub.id) ? "border-primary bg-primary/5" : "border-gray-50 hover:border-gray-200"
                        )}
                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={selectedSubIds.includes(sub.id)} className="h-5 w-5 rounded-md border-gray-300" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 text-xs uppercase leading-tight group-hover:text-primary transition-colors">{sub.name}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase flex items-center gap-1"><Clock size={10} /> {sub.duration}</p>
                          </div>
                        </div>
                        <span className="font-black text-xs text-primary">৳{sub.price}</span>
                      </div>
                    ))}
                    {!subServices?.length && !subLoading && <p className="col-span-full text-center text-muted-foreground italic text-sm py-4">No additional tasks available for this service.</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Booking Summary (Desktop Sticky) */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-24">
              <Card className="rounded-2xl md:rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
                <CardHeader className="bg-[#081621] text-white p-8">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-widest text-primary">Booking Summary</CardTitle>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Transparent Pricing breakdown</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tight">
                      <span>Base Service Fee</span>
                      <span className="text-gray-900">৳{service.basePrice.toLocaleString()}</span>
                    </div>
                    
                    {selectedSubIds.length > 0 && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tight">
                          <span>Add-ons Total</span>
                          <span className="text-gray-900">+৳{addonsTotal.toLocaleString()}</span>
                        </div>
                        <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                          {subServices?.filter(s => selectedSubIds.includes(s.id)).map(s => (
                            <div key={s.id} className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                              <span>• {s.name}</span>
                              <span>৳{s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600">
                        <Truck size={14} /> Area Base Surcharge
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {deliveryOptions?.map(opt => (
                          <div key={opt.id} className="bg-white px-2 py-1 rounded-lg border border-blue-50 text-[9px] font-bold text-gray-600">
                            {opt.label}: ৳{opt.amount}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Final Estimated Total</span>
                        <span className="text-4xl font-black text-gray-900 tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black text-[9px] px-3 py-1 rounded-full shadow-lg">VAT INCLUDED</Badge>
                    </div>
                  </div>

                  <div className="hidden lg:block space-y-4">
                    <Button 
                      onClick={handleContinueBooking} 
                      className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 uppercase tracking-tight gap-3 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Book Service Now <CalendarCheck size={24} />
                    </Button>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <CheckCircle2 size={16} className="text-primary" /> Verified Pro Technicians
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <CheckCircle2 size={16} className="text-primary" /> Satisfaction Guaranteed
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOOKING BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 px-6 py-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem]">
          <div className="container mx-auto flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Estimated</span>
              <span className="text-2xl font-black text-[#081621] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleContinueBooking} 
              className="h-14 px-10 rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/30 gap-2 flex-1 transition-all active:scale-95 bg-primary hover:bg-primary/90"
            >
              Book Now <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
