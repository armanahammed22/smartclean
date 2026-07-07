
'use client';

import React from 'react';
import Image from 'next/image';
import { 
  X, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  Languages, 
  MapPin, 
  ShieldCheck, 
  Award,
  Facebook,
  Linkedin,
  Instagram,
  Zap,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { TeamMember } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TeamMemberDetailsProps {
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamMemberDetails({ member, isOpen, onClose }: TeamMemberDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] rounded-none md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white">
        {/* Photo Section */}
        <div className="relative w-full md:w-[40%] aspect-[4/5] md:aspect-auto overflow-hidden bg-gray-50">
          <Image 
            src={member.image || 'https://picsum.photos/seed/staff/600/800'} 
            alt={member.name} 
            fill 
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col h-full max-h-[70vh] md:max-h-none overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-8 bg-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hidden md:block"
          >
            <X size={24} />
          </button>

          <DialogHeader className="text-left space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-white border-none uppercase font-black text-[8px] tracking-widest px-3 py-1 rounded-full">
                {member.department} Team
              </Badge>
              {member.featured && <Badge className="bg-amber-50 text-white border-none uppercase font-black text-[8px] tracking-widest px-3 py-1 rounded-full">Pro Certified</Badge>}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-3xl md:text-5xl font-black text-[#081621] uppercase tracking-tighter italic leading-none">{member.name}</DialogTitle>
              <p className="text-primary font-black uppercase tracking-widest text-sm">{member.designation}</p>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             <div className="p-4 bg-gray-50 rounded-3xl space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Experience</p>
                <p className="text-lg font-black text-gray-900">{member.experience}+ Years</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-3xl space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Jobs Done</p>
                <p className="text-lg font-black text-gray-900">{member.completedJobs || '150'}+</p>
             </div>
             <div className="p-4 bg-primary/5 rounded-3xl space-y-1 col-span-2 sm:col-span-1">
                <p className="text-[8px] font-black text-primary uppercase tracking-widest">Rating</p>
                <div className="flex items-center gap-1 text-primary">
                  <Star size={16} fill="currentColor" />
                  <span className="text-lg font-black">{member.rating?.toFixed(1) || '5.0'}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-2 flex items-center gap-2">
               <ShieldCheck size={14} className="text-primary"/> Professional Biography
             </h4>
             <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
               "{member.bio || "A dedicated professional with a strong track record of delivering excellence in every project. Committed to maintaining the highest standards of hygiene and client satisfaction."}"
             </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Direct Connect</h4>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                     <div className="p-2 bg-primary/5 text-primary rounded-xl"><Phone size={14}/></div>
                     {member.phone}
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                     <div className="p-2 bg-primary/5 text-primary rounded-xl"><Mail size={14}/></div>
                     {member.email}
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                     <div className="p-2 bg-primary/5 text-primary rounded-xl"><MapPin size={14}/></div>
                     {member.serviceArea || 'Dhaka North'}
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Skills & Languages</h4>
                <div className="flex flex-wrap gap-2">
                   {member.languages?.split(',').map((l, i) => (
                     <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-600 border-none font-bold text-[8px] uppercase">{l.trim()}</Badge>
                   )) || <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none font-bold text-[8px] uppercase">Bengali, English</Badge>}
                </div>
                <div className="flex gap-2">
                   {member.facebook && <a href={member.facebook} target="_blank" className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={18}/></a>}
                   {member.linkedin && <a href={member.linkedin} target="_blank" className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-700 transition-colors"><Linkedin size={18}/></a>}
                   {member.instagram && <a href={member.instagram} target="_blank" className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-pink-600 transition-colors"><Instagram size={18}/></a>}
                </div>
             </div>
          </div>

          <div className="pt-8 border-t flex flex-col sm:flex-row gap-4">
             <Button asChild className="flex-1 h-14 rounded-2xl bg-primary hover:bg-[#15435a] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                <Link href="/services">Book with {member.name.split(' ')[0]}</Link>
             </Button>
             {member.whatsapp && (
               <Button variant="outline" asChild className="flex-1 h-14 rounded-2xl border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 font-black uppercase tracking-widest text-[10px]">
                  <a href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`} target="_blank"><MessageCircle size={18} fill="currentColor" className="mr-2" /> WhatsApp Me</a>
               </Button>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
