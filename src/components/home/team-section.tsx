'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { TeamMemberCard } from './team-member-card';
import { Loader2, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export function TeamSection() {
  const db = useFirestore();

  const teamQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'team_members');
  }, [db]);

  const { data: team, isLoading } = useCollection(teamQuery);

  const sortedTeam = useMemo(() => {
    if (!team) return [];
    return team
      .filter(m => m.active === true)
      .sort((a, b) => {
        const orderA = a.displayOrder ?? 999;
        const orderB = b.displayOrder ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [team]);

  if (isLoading) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading Elite Team...</p>
    </div>
  );

  if (!sortedTeam.length) return null;

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12 px-2">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner">
                <Users size={20} strokeWidth={2.5} />
              </div>
              <Badge className="bg-primary/5 text-primary border-none uppercase font-black text-[9px] tracking-widest px-4 py-1.5 rounded-full">
                Workforce Excellence
              </Badge>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter italic font-headline leading-none">
              Meet Our <span className="text-primary">Professional</span> Team
            </h2>
          </div>
        </div>

        <div className="relative px-10 md:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {sortedTeam.map((member) => (
                <CarouselItem key={member.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                  <TeamMemberCard member={member as any} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-6 lg:-left-12 h-10 w-10 border-gray-200 text-primary hover:bg-primary hover:text-white transition-all shadow-lg" />
              <CarouselNext className="-right-6 lg:-right-12 h-10 w-10 border-gray-200 text-primary hover:bg-primary hover:text-white transition-all shadow-lg" />
            </div>
          </Carousel>
        </div>

        <div className="mt-12 text-center md:hidden">
           <div className="flex justify-center gap-2 items-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
              <ArrowRight size={14} className="animate-bounce-x" /> Swipe to see more
           </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </section>
  );
}
