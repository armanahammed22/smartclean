
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingCart, 
  TicketPercent, 
  MessageCircle, 
  User 
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useSupport } from '@/components/providers/support-provider';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const { toggleSupport, isSupportOpen } = useSupport();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Message', href: '#', icon: MessageCircle, onClick: (e: any) => { e.preventDefault(); toggleSupport(); } },
    { label: 'OFFER', href: '/#offers', icon: TicketPercent, isMiddle: true },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Account', href: '/account/dashboard', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl z-[150] border-t border-gray-100 h-[calc(4.2rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = (item.href !== '#' && pathname === item.href) || (item.label === 'Message' && isSupportOpen);
          const Icon = item.icon;
          
          const Content = (
            <>
              <div className="relative">
                <Icon size={item.isMiddle ? 26 : 22} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "scale-110 transition-transform", item.isMiddle && "text-white")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-tighter mt-1", item.isMiddle && "text-white")}>
                {item.label}
              </span>
              {isActive && !item.isMiddle && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_10px_rgba(30,95,122,0.3)]" />
              )}
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300 relative app-button",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                {Content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-300 relative app-button",
                item.isMiddle ? "scale-110 -translate-y-2" : (isActive ? "text-primary" : "text-gray-400")
              )}
            >
              {item.isMiddle ? (
                <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/30 flex flex-col items-center justify-center">
                  {Content}
                </div>
              ) : (
                Content
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
