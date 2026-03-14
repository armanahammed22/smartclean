
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  UserSquare2, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

// Hardcoded Super Admin UID for initial bootstrapping
const BOOTSTRAP_ADMIN_UID = 'gcp03WmpjROVvRdpLNsghNU4zHa2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  // Verify Admin Role from Firestore marker
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const NAV_ITEMS = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Sales Leads', href: '/admin/leads', icon: Users },
    { name: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
    { name: 'Employees', href: '/admin/employees', icon: UserSquare2 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // If loading user or checking role, show loader
  if (isUserLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-medium text-muted-foreground">Verifying access credentials...</p>
      </div>
    );
  }

  // If no user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center gap-6">
        <div className="p-4 bg-white rounded-full shadow-sm">
          <Lock size={48} className="text-gray-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground max-w-md">
            The CRM portal is a restricted area. Please sign in with your administrative account.
          </p>
        </div>
        <Button asChild className="font-bold h-12 px-8 rounded-xl">
          <Link href="/login">Go to Login Page</Link>
        </Button>
      </div>
    );
  }

  // Permission Logic: 
  // 1. User has 'roles_admins' document in Firestore
  // 2. User UID matches the hardcoded bootstrap ID
  const isAuthorized = !!adminRole || user.uid === BOOTSTRAP_ADMIN_UID;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center gap-4">
        <AlertTriangle size={64} className="text-orange-500" />
        <h2 className="text-2xl font-bold">Unauthorized Access</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm border max-w-md text-left space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account <strong>{user.email}</strong> is authenticated, but does not have permission to view this portal.
          </p>
          <div className="p-3 bg-muted rounded-lg text-[10px] font-mono break-all">
            UID: {user.uid}
          </div>
          <p className="text-xs text-muted-foreground italic">
            Fix: Go to Firestore and add this UID to the 'roles_admins' collection.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>Logout & Switch Account</Button>
          <Button asChild><Link href="/">Back to Website</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 bg-[#081621] text-white">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-primary rounded-lg text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="font-bold tracking-tight">CRM PORTAL</h1>
            <p className="text-[10px] text-gray-400 uppercase font-black">Smart Clean SaaS</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={isActive ? "text-white" : "text-gray-500 group-hover:text-primary"} />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-4 py-3 bg-white/5 rounded-xl">
             <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Authenticated As</p>
             <p className="text-xs truncate font-medium">{user.email}</p>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-destructive/10 hover:text-destructive gap-3"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {NAV_ITEMS.find(i => i.href === pathname)?.name || 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-bold">{user?.email}</p>
               <p className="text-[10px] text-primary font-black uppercase">Administrator</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
               {user?.email?.[0].toUpperCase()}
             </div>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
