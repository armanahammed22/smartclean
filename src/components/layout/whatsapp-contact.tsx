
'use client';

import React from 'react';
import { MessageCircle, X, HelpCircle, LifeBuoy, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';
import { useSupport } from '@/components/providers/support-provider';

const ICONS: Record<string, any> = {
  MessageCircle,
  HelpCircle,
  LifeBuoy,
  Headphones
};

/**
 * A dynamic Support Hub component managed from Admin Dashboard.
 * Triggered by Bottom Nav "Message" button.
 */
export function WhatsAppContact() {
  const { isSupportOpen, setSupportOpen } = useSupport();
  const db = useFirestore();

  const hubRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'support_hub') : null, [db]);
  const { data: config, isLoading } = useDoc(hubRef);

  if (isLoading) return null;

  // Global toggle check
  if (config && config.isEnabled === false) return null;

  const headerTitle = config?.headerTitle || 'Smart Clean Agent';
  const headerSubtitle = config?.headerSubtitle || 'Support Hub';
  const bodyText = config?.bodyText || 'আসসালামু আলাইকুম! আমাদের সেবা সম্পর্কে জানতে বা বুকিং দিতে স্মার্ট ক্লিন সাপোর্ট টিমের সাথে সরাসরি চ্যাট করুন।';
  const buttonText = config?.buttonText || 'হোয়াটসঅ্যাপে চ্যাট করুন';
  const supportLink = config?.supportLink || 'https://wa.me/8801919640422';
  const iconName = config?.icon || 'MessageCircle';
  
  const DisplayIcon = ICONS[iconName] || MessageCircle;

  if (!isSupportOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:justify-end p-4 pointer-events-none">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto sm:hidden" 
        onClick={() => setSupportOpen(false)} 
      />
      
      <div className="animate-in fade-in slide-in-from-bottom-10 duration-300 w-full max-w-[350px] pointer-events-auto mb-20 sm:mb-0 sm:mr-6 lg:mr-10">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#075E54] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                <DisplayIcon size={24} fill="white" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#075E54] rounded-full shadow-sm" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] leading-none">{headerSubtitle}</p>
                <p className="text-base font-black tracking-tight">{headerTitle}</p>
              </div>
            </div>
            <button 
              onClick={() => setSupportOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-8 space-y-6">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                {bodyText}
              </p>
            </div>
            
            <a 
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#25D366]/30 hover:bg-[#128C7E] transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <DisplayIcon size={22} fill="white" className="group-hover:rotate-12 transition-transform" />
              {buttonText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
