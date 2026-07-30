
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { TeamMemberCard } from './team-member-card';
import { Loader2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

  // 1. Fetch Team Members
  const teamQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'team_members');
  }, [db]);
  const { data: team, isLoading: teamLoading } = useCollection(teamQuery);

  // 2. Fetch Custom Title from Homepage Sections config
  const sectionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'homepage_sections'), where('type', '==', 'team_grid')) : null, [db]);
  const { data: sectionConfigs, isLoading: configLoading } = useCollection(sectionsQuery);
  
  const sectionTitle = sectionConfigs?.[0]?.title || "Meet Our Professional Team";

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

  if (teamLoading || configLoading) return (
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
          <div className="space-y-2 max-w-3xl text-center md:text-left">
            {/* Minimalist Header - Manageable Title */}
            <h2 className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter italic font-headline leading-tight">
              {sectionTitle}
            </h2>
          </div>
        </div>

        {/* Increased width container for wider cards */}
        <div className="relative px-4 md:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {sortedTeam.map((member) => (
                <CarouselItem key={member.id} className="pl-4 md:pl-6 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <TeamMemberCard member={member as any} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-6 lg:-left-12 h-12 w-12 border-gray-100 text-primary hover:bg-primary hover:text-white transition-all shadow-xl bg-white" />
              <CarouselNext className="-right-6 lg:-right-12 h-12 w-12 border-gray-100 text-primary hover:bg-primary hover:text-white transition-all shadow-xl bg-white" />
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
