
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
  Star, 
  Calendar,
  Zap,
  Info,
  ChevronRight
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
      ? `${service.title} (${selectedSubs.map(s => s.name).join(', ')})`
      : service.title;

    addToCart({
      ...service,
      title: combinedTitle,
      basePrice: totalPrice,
    });
    setCheckoutOpen(true);
  };

  if (serviceLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (!service) return <div className="p-20 text-center">Service Not Found</div>;

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b lg:hidden px-4 h-14 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-bold text-sm truncate">{service.title}</h1>
        </div>

        <div className="container mx-auto px-0 md:px-4 py-0 md:py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-10">
            
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-6 md:space-y-10">
              {/* Hero Banner */}
              <div className="relative aspect-[21/9] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#081621]">
                <Image 
                  src={service.imageUrl || 'https://picsum.photos/seed/srv/800/600'} 
                  alt={service.title} 
                  fill 
                  className="object-cover opacity-60" 
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
                  <div className="max-w-xl space-y-4">
                    <Badge className="bg-primary text-white border-none py-1 px-4 rounded-full font-black text-[10px] uppercase tracking-widest">
                      Expert Solution
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight font-headline">{service.title}</h1>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-white/80 text-xs font-bold bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md">
                        <Clock size={14} /> {service.duration || '2-3 Hours'}
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-xs font-bold bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md">
                        <Star size={14} fill="#FFD700" className="text-[#FFD700]" /> 4.9 Rating
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div className="p-6 md:p-0 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#081621]">Select Sub Services</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Choose one or more to schedule</p>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] px-3 py-1">
                    {subServices?.length || 0} Options
                  </Badge>
                </div>

                {subLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {subServices?.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={cn(
                          "group flex items-center justify-between p-5 md:p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer bg-white relative overflow-hidden",
                          selectedSubIds.includes(sub.id) 
                            ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary" 
                            : "border-gray-100 hover:border-primary/30 hover:shadow-md"
                        )}
                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                      >
                        <div className="flex items-center gap-4 md:gap-6 relative z-10">
                          <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedSubIds.includes(sub.id) ? "bg-primary border-primary text-white" : "border-gray-200 text-transparent"
                          )}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base md:text-lg font-black text-gray-900 leading-tight">{sub.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase text-primary">Starts from ৳{sub.price}</span>
                              <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-tighter">
                                <Clock size={10} /> {sub.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 relative z-10 shrink-0 ml-4">
                          <div className="text-primary font-black text-xs uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Schedule <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking Summary (Sticky Desktop) */}
            <div className="lg:col-span-4 p-6 md:p-0">
              <div className="sticky top-24 space-y-6">
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
                  <div className="bg-[#081621] p-8 text-white">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Booking Summary</h3>
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <p className="text-4xl font-black">৳{totalPrice.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase mt-1">Estimated Total Price</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <CalendarCheck className="text-primary" size={24} />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="p-2 bg-primary/5 rounded-xl"><MapPin size={18} className="text-primary" /></div>
                        <span className="text-xs font-bold">Service available in all major areas</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="p-2 bg-primary/5 rounded-xl"><ShieldCheck size={18} className="text-primary" /></div>
                        <span className="text-xs font-bold">100% Satisfaction Guaranteed</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="p-2 bg-primary/5 rounded-xl"><Info size={18} className="text-primary" /></div>
                        <span className="text-xs font-bold">Pay after service completion</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleBookNow} 
                      size="lg" 
                      className="w-full h-16 rounded-2xl gap-3 text-lg font-black shadow-xl shadow-primary/20 uppercase tracking-tight"
                    >
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Helper Banner */}
                <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex items-center gap-4 group cursor-pointer hover:bg-primary/10 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-primary font-black group-hover:scale-110 transition-transform">AI</div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase leading-none mb-1">Smart Consultant</p>
                    <p className="text-[10px] text-gray-500 font-medium">Need help choosing the right service? Chat with our AI advisor!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-24 lg:hidden" /> {/* Mobile Spacer */}
      </div>
    </PublicLayout>
  );
}
