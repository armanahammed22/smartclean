
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

export default function ServicesListPage() {
  const db = useFirestore();
  const { t } = useLanguage();

  const servicesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'services'), where('status', '==', 'Active'), orderBy('title', 'asc')) : null, [db]);
  const { data: services, isLoading } = useCollection(servicesQuery);

  return (
    <PublicLayout>
      <div className="bg-[#F9FAFB] min-h-screen py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4 mb-12 text-center">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest font-black py-1 px-4 rounded-full">Our Expertise</Badge>
            <h1 className="text-4xl font-black text-[#081621] font-headline">{t('nav_services')}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">{t('services_subtitle')}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : (
            <div className="space-y-4">
              {services?.map((service) => (
                <div key={service.id} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 text-primary rounded-xl"><Wrench size={24} /></div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">{service.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400">
                          <Clock size={12} /> {service.duration || 'Variable'}
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary px-2 py-0">{service.categoryId}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('price_from')}</p>
                        <p className="text-3xl font-black text-primary">৳{service.basePrice?.toLocaleString()}</p>
                      </div>
                      <Button asChild className="w-full md:w-auto h-12 rounded-xl font-black px-8 shadow-lg shadow-primary/20">
                        <Link href={`/service/${service.id}`}>{t('book_now')} <ArrowRight size={16} className="ml-2" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!services?.length && !isLoading && (
                <div className="p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic bg-white">
                  No services currently available for online booking.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
