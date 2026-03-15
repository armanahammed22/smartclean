
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  User, 
  Share2, 
  HelpCircle, 
  LogOut,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const NAV_ITEMS = [
    { name: 'Overview', href: '/account/dashboard', icon: LayoutDashboard },
    { name: 'History', href: '/account/history', icon: History },
    { name: 'Profile', href: '/account/profile', icon: User },
    { name: 'Affiliate', href: '/account/affiliate', icon: Share2 },
    { name: 'Support', href: '/support', icon: HelpCircle },
  ];

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold">
            <ChevronLeft size={20} /> Back to Site
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900">{user.displayName || 'Customer'}</p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
                pathname === item.href 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-gray-500 hover:bg-white hover:text-primary"
              )}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 px-4 py-3 h-auto text-gray-500 hover:text-destructive font-bold text-sm"
            onClick={() => signOut(auth).then(() => router.push('/'))}
          >
            <LogOut size={18} /> Logout
          </Button>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
