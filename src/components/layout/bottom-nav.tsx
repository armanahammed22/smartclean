
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingCart, 
  TicketPercent, 
  ClipboardList, 
  User 
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { 
      label: t('nav_offers'), 
      href: '/#offers', 
      icon: TicketPercent 
    },
    { 
      label: t('cart_title'), 
      href: '/cart', 
      icon: ShoppingCart,
      badge: itemCount 
    },
    { 
      label: t('nav_home'), 
      href: '/', 
      icon: Home 
    },
    { 
      label: t('service_history'), 
      href: '/account/history', 
      icon: ClipboardList 
    },
    { 
      label: t('nav_account'), 
      href: '/account/dashboard', 
      icon: User 
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-[100] border-t border-gray-100 h-14 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb">
      <div className="flex items-center justify-around h-full px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? "text-[#22C55E]" : "text-[#6B7280]"
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#22C55E] text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter">
                {item.label === t('cart_title') ? 'Cart' : 
                 item.label === t('nav_offers') ? 'Offer' : 
                 item.label === t('nav_home') ? 'Home' : 
                 item.label === t('service_history') ? 'Orders' : 'Profile'}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#22C55E] rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
