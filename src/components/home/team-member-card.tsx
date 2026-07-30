
'use client';

import React from 'react';
import Image from 'next/image';
import { MessageCircle, Phone, ArrowRight } from 'lucide-react';
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
 * Bottom 1" (96px): Content (Name, Designation, Phone, Button)
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
        className="group relative bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-[288px] w-full max-w-[192px] mx-auto select-none"
      >
        {/* Photo Container (2 Inches / 192px) */}
        <div 
          className="relative h-[192px] w-full overflow-hidden bg-gray-50 shrink-0 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
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
            <div className="absolute top-2 right-2 w-8 h-8 opacity-30 z-20 pointer-events-none grayscale brightness-200">
               <Image src={watermarkUrl} alt="Watermark" fill className="object-contain" unoptimized />
            </div>
          )}

          {/* 🛡️ PROTECTION OVERLAY */}
          <div className="absolute inset-0 bg-transparent z-10" onContextMenu={(e) => e.preventDefault()} />

          {member.featured && (
            <div className="absolute top-2 left-2 z-20">
              <Badge className="bg-primary text-white border-none px-2 py-0.5 rounded-md font-black text-[7px] uppercase tracking-widest shadow-lg">
                PRO
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section (1 Inch / 96px) */}
        <CardContent className="p-2.5 flex flex-col justify-between h-[96px] bg-white text-center">
          <div className="space-y-0">
            <h3 className="font-black text-[12px] text-gray-900 uppercase tracking-tight truncate leading-tight">
              {member.name}
            </h3>
            <p className="text-[9px] font-black text-primary uppercase tracking-tighter truncate opacity-90 leading-tight">
              {member.designation}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
             <div className="flex items-center justify-center gap-3">
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="text-gray-400 hover:text-primary transition-colors">
                    <Phone size={11} fill="currentColor" />
                  </a>
                )}
                {member.whatsapp && (
                  <a href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-[#25D366] hover:scale-110 transition-transform">
                    <MessageCircle size={12} fill="currentColor" />
                  </a>
                )}
             </div>
             
             <Button 
              size="sm" 
              onClick={() => setIsOpen(true)}
              className="h-6 w-full rounded-lg bg-gray-50 hover:bg-primary hover:text-white text-[8px] font-black uppercase text-primary transition-all border-none"
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
