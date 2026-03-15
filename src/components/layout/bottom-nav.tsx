
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Home, MessageSquare, ShieldCheck, Mail } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function BottomNav() {
  const { t } = useLanguage();
  const LOGO_IMAGE = PlaceHolderImages.find(img => img.id === 'app-logo');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#081621] text-white z-[100] border-t border-white/10 h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between h-full px-2 relative">
        <Link href="#contact" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <Mail size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Inquiry</span>
        </Link>
        
        <Link href="https://wa.me/8801919640422" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <MessageSquare size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Chat</span>
        </Link>
        
        <div className="flex-1 flex justify-center relative h-full">
          <div className="absolute -top-6">
            <Link 
              href="/" 
              className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 p-3 rounded-full shadow-[0_8px_16px_rgba(249,115,22,0.4)] border-4 border-[#081621] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <div className="relative w-8 h-8">
                {LOGO_IMAGE ? (
                  <Image 
                    src={LOGO_IMAGE.imageUrl} 
                    alt="Home" 
                    fill 
                    className="object-contain" 
                  />
                ) : (
                  <Home size={24} className="text-white" />
                )}
              </div>
            </Link>
          </div>
        </div>
        
        <Link href="/login" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <ShieldCheck size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Portal</span>
        </Link>
        
        <Link href="#" className="flex flex-col items-center gap-1 flex-1 group transition-all">
          <Menu size={20} className="text-white group-hover:text-primary transition-colors" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Menu</span>
        </Link>
      </div>
    </nav>
  );
}
