
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CalendarCheck, ShieldCheck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { getServiceById } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  
  const service = getServiceById(id as string, language);

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
        <Button onClick={() => router.push('/')}>{t('back_to_shop')}</Button>
      </div>
    );
  }

  const handleBookNow = () => {
    addToCart(service);
    setCheckoutOpen(true);
  };

  const features = language === 'bn' 
    ? ["প্রফেশনাল টিম", "সম্পূর্ণ বীমাকৃত", "পরিবেশ বান্ধব পণ্য", "সন্তুষ্টি গ্যারান্টি"]
    : ["Professional Team", "Fully Insured", "Eco-friendly Products", "Satisfaction Guaranteed"];

  return (
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
            {/* Main Content */}
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

            {/* Sidebar / Booking Card */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <Card className="rounded-3xl shadow-xl border-primary/20 overflow-hidden">
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('price_from')}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary">৳{service.displayPrice}</span>
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

                <div className="p-6 bg-white rounded-2xl border border-border/50 flex items-start gap-4">
                   <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                     <ShieldCheck size={24} />
                   </div>
                   <div className="space-y-1">
                     <h4 className="font-bold text-sm">{language === 'bn' ? 'স্মার্ট ক্লিন নিশ্চয়তা' : 'Smart Clean Assurance'}</h4>
                     <p className="text-xs text-muted-foreground">{language === 'bn' ? 'আমাদের প্রতিটি সার্ভিস ১০০০+ গ্রাহকের দ্বারা পরীক্ষিত।' : 'Every service tested by 1000+ satisfied customers.'}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
