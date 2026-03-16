
'use client';

import React, { useState } from 'react';
import { MessageCircle, X, HelpCircle, LifeBuoy, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

const ICONS: Record<string, any> = {
  MessageCircle,
  HelpCircle,
  LifeBuoy,
  Headphones
};

/**
 * A dynamic Support Hub component managed from Admin Dashboard.
 * Visibility: Only appears on the Home Page (/).
 */
export function WhatsAppContact() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const db = useFirestore();

  const hubRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'support_hub') : null, [db]);
  const { data: config, isLoading } = useDoc(hubRef);

  // Requirement: Only show on Home Page
  if (pathname !== '/' || isLoading) return null;

  // Global toggle check
  if (config && config.isEnabled === false) return null;

  const headerTitle = config?.headerTitle || 'Smart Clean Agent';
  const headerSubtitle = config?.headerSubtitle || 'Support Hub';
  const bodyText = config?.bodyText || 'আসসালামু আলাইকুম! আমাদের সেবা সম্পর্কে জানতে বা বুকিং দিতে স্মার্ট ক্লিন সাপোর্ট টিমের সাথে সরাসরি চ্যাট করুন।';
  const buttonText = config?.buttonText || 'হোয়াটসঅ্যাপে চ্যাট করুন';
  const supportLink = config?.supportLink || 'https://wa.me/8801919640422';
  const iconName = config?.icon || 'MessageCircle';
  
  const DisplayIcon = ICONS[iconName] || MessageCircle;

  return (
    <div className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-[200] flex flex-col items-end gap-4">
      {/* Dynamic Popup Card */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mb-2 w-[280px] md:w-[320px]">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="bg-[#075E54] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                  <DisplayIcon size={20} fill="white" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#075E54] rounded-full shadow-sm" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-[0.2em] leading-none">{headerSubtitle}</p>
                  <p className="text-sm font-black tracking-tight">{headerTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                aria-label="Close popup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 space-y-5">
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100/50">
                <p className="text-[13px] font-medium text-gray-600 leading-relaxed">
                  {bodyText}
                </p>
              </div>
              
              <a 
                href={supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[#25D366]/30 hover:bg-[#128C7E] transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <DisplayIcon size={20} fill="white" className="group-hover:rotate-12 transition-transform" />
                {buttonText}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(37,211,102,0.4)] transition-all duration-500 hover:scale-110 active:scale-90 relative",
          isOpen 
            ? "bg-white text-gray-900 shadow-xl border border-gray-100" 
            : "bg-[#25D366] hover:bg-[#128C7E]"
        )}
        title={isOpen ? "Close support" : "Support Hub"}
      >
        {isOpen ? (
          <X size={28} className="animate-in spin-in-90 duration-300" />
        ) : (
          <>
            <DisplayIcon size={32} fill="white" className="animate-in zoom-in-50 duration-300" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#25D366] rounded-full animate-pulse shadow-sm" />
          </>
        )}
      </button>
    </div>
  );
}
