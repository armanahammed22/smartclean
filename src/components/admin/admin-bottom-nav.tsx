"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Calendar, 
  LayoutDashboard, 
  BarChart3, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const NAV_ITEMS = [
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Booking', href: '/admin/bookings', icon: Calendar },
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Report', href: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#081621] text-white z-[200] border-t border-white/10 h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] safe-area-pb">
      <div className="flex items-center justify-between h-full px-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 transition-all h-full",
              pathname === item.href ? "text-primary bg-white/5" : "text-gray-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        ))}
        
        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-1 flex-1 text-gray-400 hover:text-destructive h-full"
            >
              <LogOut size={20} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Logout</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem] max-w-[90vw]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-red-600">Logout Admin?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium leading-relaxed">
                Confirm session termination. You will be redirected to the login page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4 flex gap-3">
              <AlertDialogCancel className="rounded-xl flex-1 font-bold">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-black uppercase text-xs tracking-widest">
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </nav>
  );
}
