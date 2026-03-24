
'use client';

import React, { useEffect } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, LogOut, HardHat, Bell, ChevronLeft, Calendar, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const staffRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole, isLoading: roleLoading } = useDoc(staffRoleRef);

  const profileRef = useMemoFirebase(() => (db && user) ? doc(db, 'employee_profiles', user.uid) : null, [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // 🛡️ Staff Authentication & Role Guard
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isUserLoading || roleLoading) return;
    if (user && !staffRole) {
      toast({ variant: "destructive", title: "Access Denied", description: "You are not registered as a technician." });
      router.replace('/login');
    }
  }, [staffRole, isUserLoading, roleLoading, user, router, toast]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.replace('/login');
    }
  };

  if (isUserLoading || roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="animate-spin text-amber-600" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Staff App...</p>
      </div>
    );
  }

  if (!user || !staffRole) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col h-full overflow-hidden">
      {/* 📱 TOP APP BAR */}
      <header className="bg-[#081621] text-white border-b border-white/5 sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl shadow-lg"><HardHat size={20} className="text-white" /></div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-widest text-amber-500">Staff App</h1>
              <p className="text-[9px] font-bold text-white/40 uppercase">Field Operations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white relative"><Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#081621]" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm border border-white/10 cursor-pointer">{user.email?.[0].toUpperCase()}</div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 p-2 rounded-[1.5rem] border-none shadow-2xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-40 px-4 py-2">Profile: {profile?.name || 'Staff'}</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link href="/account/dashboard" className="font-bold rounded-xl cursor-pointer">Customer Profile</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-black rounded-xl cursor-pointer"><LogOut size={14} className="mr-2" /> End Shift</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 📱 MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F9FAFB] pb-24">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">{children}</div>
      </main>

      {/* 📱 NATIVE-LIKE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#081621] border-t border-white/5 h-16 z-50 flex items-center justify-around px-2 pb-safe-offset-0">
        {[
          { label: 'Jobs', icon: HardHat, href: '/staff/dashboard' },
          { label: 'Schedule', icon: Calendar, href: '/staff/availability' },
          { label: 'Site', icon: ChevronLeft, href: '/' },
        ].map((item) => (
          <Link key={item.label} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all", pathname === item.href ? "text-amber-500" : "text-white/40")}>
            <item.icon size={20} className={cn(pathname === item.href && "scale-110 transition-transform")} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
