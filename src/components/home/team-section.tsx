
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TeamMemberCard } from './team-member-card';
import { Loader2, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function TeamSection() {
  const db = useFirestore();

  const teamQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Querying active members, sorted by displayOrder
    return query(
      collection(db, 'team_members'), 
      where('active', '==', true),
      orderBy('displayOrder', 'asc')
    );
  }, [db]);

  const { data: team, isLoading } = useCollection(teamQuery);

  const sortedTeam = useMemo(() => {
    if (!team) return [];
    // Secondary sort to ensure featured members appear first if order is same
    return [...team].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.displayOrder - b.displayOrder;
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
    <section className="py-20 md:py-32 bg-[#F8FAFC] overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 px-2">
          <div className="space-y-6 max-w-2xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-inner">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <Badge className="bg-primary/5 text-primary border-none uppercase font-black text-[9px] tracking-widest px-4 py-1.5 rounded-full">
                Workforce Excellence
              </Badge>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl md:text-6xl font-black text-[#081621] uppercase tracking-tighter leading-[0.9] italic font-headline">
                Meet Our <span className="text-primary">Professional</span> Team
              </h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                Trained, background-checked, and dedicated pros at your service. Experience the Smart Clean difference.
              </p>
            </div>
          </div>
          <div className="hidden lg:block">
             <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-50">
                <div className="text-right">
                   <p className="text-2xl font-black text-gray-900 leading-none">4.9/5</p>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Average Pro Rating</p>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="flex text-amber-400">
                   {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {sortedTeam.slice(0, 4).map((member) => (
            <TeamMemberCard key={member.id} member={member as any} />
          ))}
        </div>

        {sortedTeam.length > 4 && (
          <div className="mt-16 text-center">
            <Button asChild variant="outline" className="h-14 px-12 rounded-2xl border-primary/20 text-primary hover:bg-primary hover:text-white font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/5">
              <Link href="/team">View All Team Members <ArrowRight size={18} className="ml-2" /></Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
