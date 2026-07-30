'use client';

import React from 'react';
import Image from 'next/image';
import { Star, MessageCircle, Phone, Award, MapPin, ArrowRight } from 'lucide-react';
import { TeamMember } from '@/types';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TeamMemberDetails } from './team-member-details';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface TeamMemberCardProps {
  member: TeamMember;
}

/**
 * Optimized Team Member Card
 * Dimensions: 3" High x 2" Wide (approx 288px x 192px)
 * Top 2" (192px): Image with Watermark and Protection
 * Bottom 1" (96px): Content
 */
export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const watermarkUrl = settings?.watermarkLogoUrl;

  return (
    <>
      <div 
        className="group relative bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-[288px] w-full max-w-[192px] mx-auto cursor-pointer select-none"
        onClick={() => setIsOpen(true)}
      >
        {/* Photo Container (2 Inches / 192px) */}
        <div className="relative h-[192px] w-full overflow-hidden bg-gray-50 shrink-0 pointer-events-none select-none">
          <Image 
            src={member.image || 'https://picsum.photos/seed/staff/200/200'} 
            alt={member.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="192px"
            unoptimized
            draggable={false}
          />
          
          {/* 💧 WATERMARK LAYER */}
          {watermarkUrl && (
            <div className="absolute top-2 right-2 w-8 h-8 opacity-40 z-20 pointer-events-none grayscale brightness-200">
               <Image src={watermarkUrl} alt="Watermark" fill className="object-contain" unoptimized />
            </div>
          )}

          {/* 🛡️ PROTECTION OVERLAY (Prevents simple right-click/drag) */}
          <div className="absolute inset-0 bg-transparent z-10" onContextMenu={(e) => e.preventDefault()} />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          
          {member.featured && (
            <div className="absolute top-2 left-2 z-20">
              <Badge className="bg-primary text-white border-none px-2 py-0.5 rounded-md font-black text-[7px] uppercase tracking-widest shadow-lg">
                PRO
              </Badge>
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30 pointer-events-auto">
             <div className="flex gap-1.5 justify-center">
                {member.phone && (
                  <button className="h-7 w-7 rounded-lg bg-white text-primary flex items-center justify-center shadow-lg active:scale-90" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${member.phone}`; }}>
                    <Phone size={12} />
                  </button>
                )}
                {member.whatsapp && (
                  <button className="h-7 w-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-90" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`, '_blank'); }}>
                    <MessageCircle size={12} fill="currentColor" />
                  </button>
                )}
             </div>
          </div>
        </div>

        {/* Content Section (1 Inch / 96px) */}
        <CardContent className="p-3 flex flex-col justify-center h-[96px] bg-white text-center">
          <div className="space-y-0.5">
            <h3 className="font-black text-[11px] text-gray-900 uppercase tracking-tight truncate leading-none">
              {member.name}
            </h3>
            <p className="text-[8px] font-bold text-primary uppercase tracking-tighter truncate opacity-80">
              {member.designation}
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-1">
             <div className="flex items-center justify-center gap-1.5 text-gray-400">
                <Phone size={8} className="text-primary/60 shrink-0" />
                <span className="text-[8px] font-black tracking-tighter truncate">{member.phone || '01XXXXXXXXX'}</span>
             </div>
             <div className="flex items-center justify-center gap-1.5 text-gray-400">
                <MapPin size={8} className="text-primary/60 shrink-0" />
                <span className="text-[8px] font-bold tracking-tighter truncate uppercase">{member.serviceArea || 'Dhaka North'}</span>
             </div>
          </div>
          
          <div className="mt-1 flex items-center justify-center gap-1">
             <div className="flex text-amber-500">
                <Star size={8} fill="currentColor" />
             </div>
             <span className="text-[8px] font-black text-gray-900">{member.rating?.toFixed(1) || '5.0'}</span>
          </div>
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
