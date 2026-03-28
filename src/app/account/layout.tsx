
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
  Loader2,
  ShieldCheck,
  Globe,
  HardHat,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const BOOTSTRAP_ADMIN_UIDS = ['6YTKdslETkVXcftvhSY5x9sjOgT2', 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, isLoading: profileLoading, error: profileError } = useDoc(profileRef);

  // Auth Guards for role-based internal portal links
  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid)) || user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;

  const staffRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole } = useDoc(staffRoleRef);
  const isStaff = !!staffRole;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Active Purge: Logout banned or restricted users automatically
  const isRestricted = profile?.status && profile.status !== 'active';
  useEffect(() => {
    if (!isUserLoading && !profileLoading && user && (isRestricted || profileError) && auth) {
      const reason = isRestricted ? `Account ${profile.status}` : "Session Error";
      toast({ variant: "destructive", title: "Security Purge", description: `${reason}. Please contact support.` });
      signOut(auth).then(() => {
        router.push('/login');
      });
    }
  }, [isRestricted, profileError, isUserLoading, profileLoading, user, auth, router, toast, profile?.status]);

  const NAV_ITEMS = [
    { name: 'Dashboard', href: '/account/dashboard', icon: LayoutDashboard },
    { name: 'Custom Requests', href: '/account/custom-requests', icon: Zap },
    { name: 'History', href: '/account/history', icon: History },
    { name: 'Profile Settings', href: '/account/profile', icon: User },
    { name: 'Affiliate Program', href: '/account/affiliate', icon: Share2 },
    { name: 'Customer Support', href: '/support', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Loading Portal...</p>
      </div>
    );
  }

  if (!user || isRestricted || profileError) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest hover:translate-x-[-4px] transition-transform">
            <ChevronLeft size={20} /> Back to Site
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none">{profile?.name || user.displayName || 'Customer'}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-1">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20 border-2 border-white">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-72 shrink-0 space-y-2">
          <div className="p-6 bg-[#081621] text-white rounded-[2rem] mb-6 flex items-center gap-4 border border-white/5 shadow-xl">
            <div className="p-3 bg-primary rounded-2xl shadow-lg"><ShieldCheck size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">User Role</p>
              <p className="text-sm font-black uppercase tracking-tight">Verified Client</p>
            </div>
          </div>

          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10" 
                    : "text-gray-500 hover:bg-white hover:text-primary border border-transparent hover:border-gray-100"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </div>

          {/* 🔐 Management Portals (Authorized Only) */}
          {(isAdmin || isStaff) && (
            <div className="pt-6 mt-6 border-t border-gray-200 space-y-3">
              <p className="px-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Management Access</p>
              {isAdmin && (
                <Link href="/admin/dashboard" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all">
                  <Globe size={18} /> Admin Portal
                </Link>
              )}
              {isStaff && (
                <Link href="/staff/dashboard" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-amber-600 hover:bg-amber-50 transition-all">
                  <HardHat size={18} /> Staff Portal
                </Link>
              )}
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-4 px-6 py-4 h-auto text-gray-500 hover:text-destructive hover:bg-red-50 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
              onClick={handleLogout}
            >
              <LogOut size={18} /> Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-0 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
