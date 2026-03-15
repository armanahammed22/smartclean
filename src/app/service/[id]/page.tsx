"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  CalendarCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Loader2, 
  Zap,
  Info,
  ChevronRight,
  Wrench,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
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

  const serviceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: serviceLoading } = useDoc(serviceRef);

  const subServicesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', id), where('status', '==', 'Active'));
  }, [db, id]);

  const { data: subServices, isLoading: subLoading } = useCollection(subServicesQuery);

  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  const totalPrice = useMemo(() => {
    if (!service) return 0;
    const subsPrice = subServices
      ?.filter(s => selectedSubIds.includes(s.id))
      .reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
    return (service.basePrice || 0) + subsPrice;
  }, [service, subServices, selectedSubIds]);

  const handleBookNow = () => {
    if (!service) return;
    const selectedSubs = subServices?.filter(s => selectedSubIds.includes(s.id)) || [];
    const combinedTitle = selectedSubs.length > 0 
      ? `${service.title} + ${selectedSubs.map(s => s.name).join(', ')}`
      : service.title;

    addToCart({
      ...service,
      title: combinedTitle,
      basePrice: totalPrice,
    } as any);
    setCheckoutOpen(true);
  };

  if (serviceLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (!service) return <div className="p-20 text-center">Service Not Found</div>;

  return (
    <PublicLayout>
      <div className="bg-[#F2F4F8] min-h-screen pb-20">
        <div className="container mx-auto px-4 py-12">
          <Button variant="ghost" onClick={() => router.back()} className="mb-10 gap-2 group font-bold">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Explore All Services
          </Button>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Content: Service Builder */}
            <div className="lg:col-span-8 space-y-12">
              {/* High Impact Hero */}
              <div className="relative aspect-[21/8] rounded-[3rem] overflow-hidden shadow-2xl bg-[#081621] border border-white/5">
                <Image 
                  src={service.imageUrl || 'https://picsum.photos/seed/srv/1200/600'} 
                  alt={service.title || 'Service Banner'} 
                  fill 
                  className="object-cover opacity-50" 
                />
                <div className="absolute inset-0 flex flex-col justify-center p-12 md:p-20">
                  <div className="max-w-2xl space-y-6">
                    <Badge className="bg-primary text-white border-none py-1.5 px-5 rounded-full font-black text-xs uppercase tracking-widest">
                      Premium Solution
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight font-headline uppercase tracking-tight">{service.title}</h1>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-3 text-white/90 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                        <Clock size={18} className="text-primary" /> {service.duration || '2-3 Hours'}
                      </div>
                      <div className="flex items-center gap-3 text-white/90 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                        <Sparkles size={18} className="text-primary" /> Expert Team Assigned
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Description */}
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Info className="text-primary" /> Service Overview
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  {service.description}
                </p>
              </div>

              {/* Sub-Service Selection Grid */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#081621]">Available Task Add-ons</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Select one or more to personalize your booking</p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border shadow-sm font-black text-[10px] uppercase text-primary">
                    {subServices?.length || 0} Specializations
                  </div>
                </div>

                {subLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subServices?.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={cn(
                          "group p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer bg-white relative flex flex-col justify-between h-full",
                          selectedSubIds.includes(sub.id) 
                            ? "border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary translate-y-[-4px]" 
                            : "border-transparent hover:border-primary/20 hover:shadow-xl hover:translate-y-[-2px] shadow-sm"
                        )}
                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                      >
                        <div className="space-y-6">
                          <div className="flex justify-between items-start">
                            <div className={cn(
                              "w-14 h-14 rounded-[1.25rem] border-2 flex items-center justify-center transition-all duration-500",
                              selectedSubIds.includes(sub.id) ? "bg-primary border-primary text-white scale-110" : "bg-gray-50 border-gray-100 text-transparent"
                            )}>
                              <CheckCircle2 size={32} />
                            </div>
                            <Badge variant="secondary" className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-tighter border-none px-3">Add-on</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-xl font-black text-[#081621] leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">{sub.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">{sub.description || 'Professional specialization for maximum results.'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 mt-auto border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pricing</span>
                            <span className="text-lg font-black text-primary">৳{sub.price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                            <Clock size={12} /> {sub.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking Summary Board */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                <Card className="rounded-[3rem] shadow-2xl border-none overflow-hidden bg-white group">
                  <div className="bg-[#081621] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><Wrench size={160} /></div>
                    <div className="relative z-10 space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Live Booking Summary</h3>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-5xl font-black text-white tracking-tighter">৳{totalPrice.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-white/40 uppercase mt-2 tracking-widest">Calculated Price (Estimated)</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-[1.5rem] backdrop-blur-md border border-white/5">
                          <CalendarCheck className="text-primary" size={32} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-10 space-y-10">
                    <div className="space-y-6">
                      {[
                        { icon: MapPin, label: "Area Availability", val: "Nationwide Dhaka Coverage" },
                        { icon: ShieldCheck, label: "Trust Seal", val: "100% Satisfaction Guaranteed" },
                        { icon: Zap, label: "Pricing Model", val: "Pay after service completion" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-5 group/item">
                          <div className="p-3 bg-primary/5 rounded-2xl transition-colors group-hover/item:bg-primary group-hover/item:text-white text-primary">
                            <item.icon size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">{item.label}</span>
                            <span className="text-xs font-bold text-gray-700">{item.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={handleBookNow} 
                      size="lg" 
                      className="w-full h-20 rounded-[1.5rem] gap-4 text-xl font-black shadow-2xl shadow-primary/20 uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Book This Appointment <ChevronRight size={20} />
                    </Button>
                  </CardContent>
                </Card>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group cursor-pointer hover:border-primary/30 transition-all hover:shadow-md">
                  <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center shadow-inner text-primary font-black text-lg group-hover:scale-110 transition-transform">AI</div>
                  <div>
                    <p className="text-sm font-black text-[#081621] uppercase tracking-tight mb-1">Service Consultant</p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Confused about add-ons? Let our AI suggest the best package for your needs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
