
'use client';

import React from 'react';
import Image from 'next/image';
import { MessageCircle, Phone } from 'lucide-react';
import { TeamMember } from '@/types';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamMemberDetails } from './team-member-details';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface TeamMemberCardProps {
  member: TeamMember;
}

/**
 * Optimized Team Member Card
 * Dimensions: Increased width to fill space (approx 240px wide)
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
        className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-[340px] w-full max-w-[240px] mx-auto select-none"
      >
        {/* Photo Container (Approx 2 Inches / 192px) */}
        <div 
          className="relative h-[210px] w-full overflow-hidden bg-gray-50 shrink-0 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <Image 
            src={member.image || 'https://picsum.photos/seed/staff/400/400'} 
            alt={member.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="240px"
            unoptimized
            draggable={false}
          />
          
          {/* 💧 WATERMARK LAYER */}
          {watermarkUrl && (
            <div className="absolute top-3 right-3 w-8 h-8 opacity-20 z-20 pointer-events-none grayscale brightness-200">
               <Image src={watermarkUrl} alt="Watermark" fill className="object-contain" unoptimized />
            </div>
          )}

          {/* 🛡️ PROTECTION OVERLAY */}
          <div className="absolute inset-0 bg-transparent z-10" onContextMenu={(e) => e.preventDefault()} />

          {member.featured && (
            <div className="absolute top-3 left-3 z-20">
              <Badge className="bg-primary text-white border-none px-2 py-0.5 rounded-md font-black text-[7px] uppercase tracking-widest shadow-lg">
                ELITE
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4 flex flex-col justify-between h-[130px] bg-white text-center">
          <div className="space-y-0.5">
            <h3 className="font-black text-[14px] text-gray-900 uppercase tracking-tight truncate leading-tight">
              {member.name}
            </h3>
            <p className="text-[10px] font-black text-primary uppercase tracking-tighter truncate opacity-80">
              {member.designation}
            </p>
            
            {/* 📱 PRIMARY CONTACT DISPLAY */}
            <div className="flex items-center justify-center gap-1.5 pt-1.5">
               {member.whatsapp ? (
                 <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <MessageCircle size={10} fill="currentColor" />
                    <span className="tracking-tight">{member.whatsapp}</span>
                 </div>
               ) : member.phone ? (
                 <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    <Phone size={10} fill="currentColor" />
                    <span className="tracking-tight">{member.phone}</span>
                 </div>
               ) : null}
            </div>
          </div>

          <div className="mt-auto">
             <Button 
              size="sm" 
              onClick={() => setIsOpen(true)}
              className="h-9 w-full rounded-xl bg-primary text-white hover:bg-[#15435a] text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 border-none"
             >
               বিস্তারিত / Details
             </Button>
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
