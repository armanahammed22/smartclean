
'use client';

import React from 'react';
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
  Lock,
  Wrench,
  CreditCard,
  Package,
  ShoppingCart,
  MapPin,
  BarChart3,
  TicketPercent,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

const BOOTSTRAP_ADMIN_UID = 'gcp03WmpjROVvRdpLNsghNU4zHa2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const NAV_ITEMS = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Sales Leads', href: '/admin/leads', icon: Users },
    { name: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
    { name: 'Inventory', href: '/admin/products', icon: Package },
    { name: 'Services', href: '/admin/services', icon: Wrench },
    { name: 'Customers', href: '/admin/customers', icon: UserSquare2 },
    { name: 'Service Areas', href: '/admin/areas', icon: MapPin },
    { name: 'Marketing', href: '/admin/marketing', icon: TicketPercent },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Couriers', href: '/admin/couriers', icon: Truck },
    { name: 'Subscription', href: '/admin/subscription', icon: CreditCard },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-medium text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center gap-6">
        <div className="p-4 bg-white rounded-full shadow-sm">
          <Lock size={48} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold">Authentication Required</h2>
        <Button asChild><Link href="/login">Go to Login</Link></Button>
      </div>
    );
  }

  const isAuthorized = !!adminRole || user.uid === BOOTSTRAP_ADMIN_UID;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center gap-4">
        <AlertTriangle size={64} className="text-orange-500" />
        <h2 className="text-2xl font-bold">Unauthorized Access</h2>
        <p className="text-muted-foreground max-w-xs mx-auto">Your account does not have admin privileges. UID: {user.uid}</p>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 bg-[#081621] text-white">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-primary rounded-lg text-white"><ShieldCheck size={24} /></div>
          <div>
            <h1 className="font-bold tracking-tight">ERP PORTAL</h1>
            <p className="text-[10px] text-gray-400 uppercase font-black">Smart Clean SaaS</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                pathname === item.href ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={pathname === item.href ? "text-white" : "text-gray-500"} />
                <span className="text-sm font-semibold">{item.name}</span>
              </div>
              {pathname === item.href && <ChevronRight size={14} />}
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-destructive gap-3" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {NAV_ITEMS.find(i => i.href === pathname)?.name || 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-gray-900">{user.email?.split('@')[0]}</p>
               <p className="text-[9px] text-primary font-black uppercase tracking-tighter">System Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
