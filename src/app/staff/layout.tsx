'use client';

import React, { useEffect } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, ShieldAlert, ChevronLeft, LogOut, HardHat, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const staffRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_employees', user.uid);
  }, [db, user]);

  const { data: staffRole, isLoading: roleLoading } = useDoc(staffRoleRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="animate-spin text-amber-600" size={48} />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Verifying Technician Access...</p>
      </div>
    );
  }

  if (!user) return null;

  if (!staffRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center gap-6">
        <div className="p-6 bg-white rounded-full shadow-sm">
          <ShieldAlert size={64} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight">Staff Access Denied</h2>
          <p className="text-muted-foreground max-w-xs mx-auto font-medium">Your account is not registered in our technician database. Please contact your supervisor.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleLogout} className="rounded-xl gap-2"><LogOut size={18} /> Sign Out</Button>
          <Button asChild className="rounded-xl shadow-lg"><Link href="/">Back to Site</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Mobile-Friendly Technician Header */}
      <header className="bg-[#081621] text-white border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20"><HardHat size={20} className="text-white" /></div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-black uppercase tracking-widest text-amber-500">Technician Portal</h1>
              <p className="text-[10px] font-bold text-white/40 uppercase">Smart Clean Operations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#081621]" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
                  {user.email?.[0].toUpperCase()}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 p-2 rounded-2xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-40 px-4 py-2">My Profile</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link href="/account/dashboard" className="font-bold rounded-xl">Customer View</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-black rounded-xl"><LogOut size={14} className="mr-2" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto">
        {children}
      </main>

      {/* Quick Navigation for Staff (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#081621] border-t border-white/5 h-16 z-50 flex items-center justify-around px-4">
        <Link href="/staff/dashboard" className="flex flex-col items-center gap-1 text-amber-500">
          <HardHat size={20} />
          <span className="text-[9px] font-black uppercase">Jobs</span>
        </Link>
        <Link href="/staff/availability" className="flex flex-col items-center gap-1 text-white/40">
          <Bell size={20} />
          <span className="text-[9px] font-black uppercase">Schedule</span>
        </Link>
        <Link href="/" className="flex flex-col items-center gap-1 text-white/40">
          <ChevronLeft size={20} />
          <span className="text-[9px] font-black uppercase">Site</span>
        </Link>
      </nav>
    </div>
  );
}
