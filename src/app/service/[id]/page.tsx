"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CalendarCheck, ShieldCheck, CheckCircle2, Clock, MapPin, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', id));
  }, [db, id]);

  const { data: subServices, isLoading: subLoading } = useCollection(subServicesQuery);

  const [selectedSubServiceIds, setSelectedSubServiceIds] = useState<string[]>([]);

  const totalPrice = useMemo(() => {
    if (!service) return 0;
    const subsPrice = subServices
      ?.filter(s => selectedSubServiceIds.includes(s.id))
      .reduce((acc, s) => acc + s.price, 0) || 0;
    return service.basePrice + subsPrice;
  }, [service, subServices, selectedSubServiceIds]);

  const handleBookNow = () => {
    if (!service) return;
    
    // Create a combined service entry for the cart
    const selectedSubs = subServices?.filter(s => selectedSubServiceIds.includes(s.id)) || [];
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

  const features = language === 'bn' 
    ? ["প্রফেশনাল টিম", "সম্পূর্ণ বীমাকৃত", "পরিবেশ বান্ধব পণ্য", "সন্তুষ্টি গ্যারান্টি"]
    : ["Professional Team", "Fully Insured", "Eco-friendly Products", "Satisfaction Guaranteed"];

  return (
    <PublicLayout>
      <div className="bg-[#F2F4F8] min-h-screen pb-24">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-8 gap-2 hover:bg-white"
          >
            <ArrowLeft size={18} />
            {t('back_to_list')}
          </Button>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg bg-white border border-border/50">
                  {service.imageUrl ? (
                    <Image src={service.imageUrl} alt={service.title} fill className="object-cover" priority />
                  ) : (
                    <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                      <CalendarCheck size={80} className="text-primary/20" />
                    </div>
                  )}
                </div>

                <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-border/50 space-y-6">
                  <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary border-none text-sm font-bold">
                      {t('services_title')}
                    </Badge>
                    <h1 className="text-4xl font-bold text-[#081621] font-headline">
                      {service.title}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Sub Services Selection */}
                  {subServices && subServices.length > 0 && (
                    <div className="pt-8 border-t space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Info size={20} className="text-primary" /> 
                        {language === 'bn' ? 'অতিরিক্ত সেবা নির্বাচন করুন' : 'Select Additional Services'}
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {subServices.map(sub => (
                          <div 
                            key={sub.id} 
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                              selectedSubServiceIds.includes(sub.id) ? "bg-primary/5 border-primary shadow-sm" : "bg-gray-50 border-transparent hover:border-gray-200"
                            )}
                            onClick={() => toggleSubService(sub.id)}
                          >
                            <div className="flex items-center gap-4">
                              <Checkbox checked={selectedSubServiceIds.includes(sub.id)} onCheckedChange={() => toggleSubService(sub.id)} />
                              <div>
                                <p className="font-bold text-[#081621]">{sub.name}</p>
                                <p className="text-xs text-muted-foreground">{sub.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-primary">৳{sub.price}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{sub.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-[#F2F4F8] rounded-xl">
                        <CheckCircle2 size={20} className="text-primary" />
                        <span className="font-bold text-[#081621]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                  <Card className="rounded-3xl shadow-xl border-primary/20 overflow-hidden">
                    <CardContent className="p-8 space-y-8">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('price_from')}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-primary">৳{totalPrice.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground italic">/ {language === 'bn' ? 'সার্ভিস' : 'service'}</span>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock size={18} className="text-primary" />
                          <span>{t('footer_hours')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <MapPin size={18} className="text-primary" />
                          <span>{language === 'bn' ? 'সারাদেশে সেবা প্রদান' : 'Service available nationwide'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <ShieldCheck size={18} className="text-primary" />
                          <span>{language === 'bn' ? '১০০% নিরাপদ লেনদেন' : '100% Secure Transaction'}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button 
                          onClick={handleBookNow} 
                          size="lg" 
                          className="w-full h-16 rounded-2xl gap-3 text-lg font-bold shadow-lg"
                        >
                          <CalendarCheck size={24} />
                          {t('book_now')}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">
                          {t('service_billing_note')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
