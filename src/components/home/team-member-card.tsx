
'use client';

import React from 'react';
import Image from 'next/image';
import { Star, MessageCircle, Phone, Award, Briefcase, Zap, ArrowRight } from 'lucide-react';
import { TeamMember } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TeamMemberDetails } from './team-member-details';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div 
        className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {/* Photo Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          <Image 
            src={member.image || 'https://picsum.photos/seed/staff/400/500'} 
            alt={member.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081621]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {member.featured && (
              <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest shadow-xl animate-pulse">
                Expert Pro
              </Badge>
            )}
            <Badge className="bg-white/90 backdrop-blur-md text-[#081621] border-none px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest shadow-sm">
              {member.experience}+ Years Exp.
            </Badge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
             <div className="flex gap-2">
                {member.phone && (
                  <Button size="icon" className="h-10 w-10 rounded-xl bg-white text-primary hover:bg-white shadow-xl" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:${member.phone}`}><Phone size={18} /></a>
                  </Button>
                )}
                {member.whatsapp && (
                  <Button size="icon" className="h-10 w-10 rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] shadow-xl" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`} target="_blank"><MessageCircle size={18} fill="currentColor" /></a>
                  </Button>
                )}
             </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6 flex flex-col flex-1 space-y-4">
          <div className="space-y-1 text-center">
            <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight leading-none group-hover:text-primary transition-colors">
              {member.name}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{member.designation}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
            <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-2xl">
               <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                  <Star size={12} fill="currentColor" />
                  <span className="text-xs font-black text-gray-900">{member.rating || '5.0'}</span>
               </div>
               <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Rating</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-2xl">
               <span className="text-xs font-black text-gray-900 mb-0.5">{member.completedJobs || '150'}+</span>
               <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Jobs</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 font-medium text-center line-clamp-2 italic leading-relaxed">
            "{member.bio || "Dedicated to providing high-quality professional cleaning and sanitization services."}"
          </p>

          <Button 
            variant="ghost" 
            className="w-full mt-auto h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 gap-2"
          >
            Profile Details <ArrowRight size={14} />
          </Button>
        </CardContent>
      </div>

      <TeamMemberDetails 
        member={member} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
