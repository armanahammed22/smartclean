'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { useSupport } from '@/components/providers/support-provider';
import { usePathname } from 'next/navigation';

/**
 * Dynamic Footer Live Chat Button
 * Controlled entirely from the Admin Dashboard.
 */
export function FooterLiveChat() {
  const db = useFirestore();
  const pathname = usePathname();
  const { toggleSupport } = useSupport();
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 🛡️ Security Check: Hide in Admin & Staff area
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/staff');

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'footer_live_chat') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !config || !config.isEnabled || isAdmin) return null;

  // Visibility Check
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile && config.mobileVisible === false) return null;
  if (!isMobile && config.desktopVisible === false) return null;

  const ActiveIcon = (LucideIcons as any)[config.iconName] || LucideIcons.MessageCircle;

  const handleClick = () => {
    if (config.actionType === 'popup') {
      toggleSupport();
    } else {
      // Logic for third party widgets (Tawk.to, etc.)
      if (typeof window !== 'undefined') {
        if ((window as any).Tawk_API) (window as any).Tawk_API.maximize();
        else if ((window as any).tidioChatApi) (window as any).tidioChatApi.show();
        else if ((window as any).$crisp) (window as any).$crisp.push(['do', 'chat:open']);
        else toggleSupport(); // Fallback
      }
    }
  };

  const dynamicStyles = {
    backgroundColor: isHovered ? config.hoverBgColor : config.bgColor,
    color: isHovered ? config.hoverTextColor : config.textColor,
    border: `1px solid ${isHovered ? config.hoverBorderColor : config.borderColor}`,
    borderRadius: `${config.borderRadius}px`,
    padding: `${config.paddingY}px ${config.paddingX}px`,
    width: config.btnWidth || 'auto',
    height: config.btnHeight ? `${config.btnHeight}px` : 'auto',
    boxShadow: config.showShadow ? (isHovered ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.2)') : 'none',
    marginTop: `${config.marginTop || 12}px`,
    marginBottom: `${config.marginBottom || 0}px`
  };

  return (
    <div className={cn("transition-all duration-300", config.isFullWidth ? "w-full" : "w-fit")}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={dynamicStyles}
        className={cn(
          "flex items-center gap-3 transition-all active:scale-95 group overflow-hidden",
          config.isFullWidth ? "w-full justify-center" : "w-fit",
          config.animation === 'pulse' && "animate-pulse",
          config.animation === 'bounce' && "animate-bounce",
          config.animation === 'float' && "animate-float"
        )}
      >
        <ActiveIcon 
          size={config.iconSize} 
          style={{ order: config.iconPosition === 'left' ? 0 : 2 }} 
          className="transition-transform duration-500 group-hover:rotate-12"
        />
        <div className="flex flex-col text-left" style={{ order: 1 }}>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-tight leading-none">{config.btnText}</span>
          {config.description && <span className="text-[7px] md:text-[9px] font-bold opacity-70 uppercase tracking-widest mt-0.5 whitespace-nowrap">{config.description}</span>}
        </div>
      </button>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
