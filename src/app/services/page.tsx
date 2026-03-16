
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-4 mb-12 text-center">
            <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest font-black py-1 px-4 rounded-full">Our Expertise</Badge>
            <h1 className="text-4xl font-black text-[#081621] font-headline">{t('nav_services')}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">{t('services_subtitle')}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {services?.map((service) => (
                <div key={service.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col relative h-full">
                  <Link href={`/service/${service.id}`} className="block relative aspect-[4/3] overflow-hidden shrink-0">
                    <Image 
                      src={service.imageUrl || 'https://picsum.photos/seed/srv/600/400'} 
                      alt={service.title || 'Service Image'} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 text-primary border-none shadow-md backdrop-blur-md font-black text-[8px] uppercase px-2 py-0.5 rounded-full">{service.categoryId || 'General'}</Badge>
                    </div>
                  </Link>
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <div className="space-y-0.5">
                      <Link href={`/service/${service.id}`} className="hover:text-primary transition-colors block">
                        <h3 className="text-sm md:text-base font-bold group-hover:text-primary transition-colors line-clamp-1 leading-tight uppercase tracking-tight">{service.title}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-primary tracking-tighter">৳{(service.basePrice || 0).toLocaleString()}</span>
                        <span className="text-[9px] font-black uppercase text-gray-400">{t('price_from')}</span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full rounded-full font-black text-[10px] uppercase shadow-md h-9 tracking-widest transition-transform active:scale-95 mt-auto" asChild>
                      <Link href={`/service/${service.id}`}>{t('book_now')}</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {!services?.length && !isLoading && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground italic bg-white">
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
