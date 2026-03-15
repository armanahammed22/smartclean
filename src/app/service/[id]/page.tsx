"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CalendarCheck, ShieldCheck, CheckCircle2, Clock, MapPin, Loader2, Info, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  const serviceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: serviceLoading } = useDoc(serviceRef);

  const subServicesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', id), where('status', '==', 'Active'));
  }, [db, id]);

  const { data: subServices, isLoading: subLoading } = useCollection(subServicesQuery);

  const [selectedSubServiceIds, setSelectedSubServiceIds] = useState<string[]>([]);

  const totalPrice = useMemo(() => {
    if (!service) return 0;
    const subsPrice = subServices
      ?.filter(s => selectedSubServiceIds.includes(s.id))
      .reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
    return (service.basePrice || 0) + subsPrice;
  }, [service, subServices, selectedSubServiceIds]);

  const handleBookNow = () => {
    if (!service) return;
    
    const selectedSubs = subServices?.filter(s => selectedSubServiceIds.includes(s.id)) || [];
    const combinedTitle = selectedSubs.length > 0 
      ? `${service.title} + ${selectedSubs.map(s => s.name).join(', ')}`
      : service.title;

    addToCart({
      ...service,
      title: combinedTitle,
      basePrice: totalPrice,
    });
    setCheckoutOpen(true);
  };

  const toggleSubService = (subId: string) => {
    setSelectedSubServiceIds(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  if (serviceLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (!service) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Button onClick={() => router.push('/')}>{t('back_to_shop')}</Button>
        </div>
      </PublicLayout>
    );
  }

  const guarantees = language === 'bn' 
    ? ["প্রফেশনাল টিম", "১০০% নিরাপদ", "পরিবেশ বান্ধব", "সন্তুষ্টি গ্যারান্টি"]
    : ["Pro Cleaners", "Fully Insured", "Eco-friendly", "Satisfaction Guaranteed"];

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-24">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-8 gap-2 hover:bg-white rounded-xl"
          >
            <ArrowLeft size={18} />
            {t('back_to_list')}
          </Button>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-10">
                {/* Hero Header */}
                <div className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
                  {service.imageUrl ? (
                    <Image src={service.imageUrl} alt={service.title || 'Service'} fill className="object-cover" priority />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#081621] to-[#0a253a] flex items-center justify-center">
                      <CalendarCheck size={100} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                    <Badge className="bg-primary text-white border-none w-fit mb-4 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-[0.2em]">Expert Solution</Badge>
                    <h1 className="text-3xl md:text-5xl font-black text-white font-headline leading-tight">{service.title}</h1>
                  </div>
                </div>

                {/* Description & Guarantees */}
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Service Overview</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {guarantees.map((g, i) => (
                      <div key={i} className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl gap-3">
                        <div className="p-2 bg-white rounded-full shadow-sm text-primary"><CheckCircle2 size={20} /></div>
                        <span className="text-[10px] font-black uppercase text-gray-700 tracking-tight">{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub Services Selection */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
                      <Star className="text-primary" fill="currentColor" size={24} />
                      {language === 'bn' ? 'অতিরিক্ত সেবাসমূহ' : 'Available Add-ons'}
                    </h2>
                    <Badge variant="secondary" className="bg-white text-primary border-primary/20 px-3 py-1 rounded-full font-bold">
                      {subServices?.length || 0} Options
                    </Badge>
                  </div>

                  {subLoading ? (
                    <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {subServices?.map(sub => (
                        <div 
                          key={sub.id} 
                          className={cn(
                            "group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer bg-white relative overflow-hidden",
                            selectedSubServiceIds.includes(sub.id) 
                              ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary" 
                              : "border-gray-100 hover:border-primary/30 hover:shadow-md"
                          )}
                          onClick={() => toggleSubService(sub.id)}
                        >
                          <div className="flex items-center gap-6 relative z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors",
                              selectedSubServiceIds.includes(sub.id) ? "bg-primary border-primary text-white" : "border-gray-200 text-transparent"
                            )}>
                              <CheckCircle2 size={24} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-black text-gray-900 leading-none">{sub.name}</h4>
                              <p className="text-sm text-muted-foreground max-w-md line-clamp-1">{sub.description}</p>
                              <div className="flex items-center gap-3 pt-1">
                                <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock size={10} /> {sub.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex flex-col items-end gap-1 relative z-10">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Add for only</span>
                            <p className="text-2xl font-black text-primary">৳{sub.price}</p>
                          </div>
                          
                          {/* Progress Decoration */}
                          {selectedSubServiceIds.includes(sub.id) && (
                            <div className="absolute bottom-0 left-0 h-1 bg-primary w-full animate-in slide-in-from-left duration-1000" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Booking Card */}
              <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                  <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
                    <CardHeader className="bg-[#081621] text-white p-8">
                      <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estimated Total</span>
                          <div className="text-right">
                            <p className="text-4xl font-black text-primary leading-none">৳{totalPrice.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Plus applicable taxes</p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="p-2 bg-gray-50 rounded-xl"><Clock size={18} className="text-primary" /></div>
                            <span className="text-xs font-bold">{t('footer_hours')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="p-2 bg-gray-50 rounded-xl"><MapPin size={18} className="text-primary" /></div>
                            <span className="text-xs font-bold">Available in All Major Areas</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="p-2 bg-gray-50 rounded-xl"><ShieldCheck size={18} className="text-primary" /></div>
                            <span className="text-xs font-bold">100% Satisfaction Guarantee</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button 
                          onClick={handleBookNow} 
                          size="lg" 
                          className="w-full h-16 rounded-2xl gap-3 text-lg font-black shadow-xl shadow-primary/30 uppercase tracking-tight"
                        >
                          <CalendarCheck size={24} />
                          {t('book_now')}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground italic leading-relaxed px-4">
                          {t('service_billing_note')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Signal */}
                  <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-primary font-black">AI</div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase leading-none mb-1">Smart Advisor</p>
                      <p className="text-[10px] text-gray-500 font-medium">Need help picking? Ask our AI expert!</p>
                    </div>
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
