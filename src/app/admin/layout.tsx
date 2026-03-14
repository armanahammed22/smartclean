
'use client';

import React, { useState } from 'react';
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
  ChevronLeft,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, color: 'text-amber-400' },
    { name: 'Sales Leads', href: '/admin/leads', icon: Users, color: 'text-orange-400' },
    { name: 'Bookings', href: '/admin/bookings', icon: CalendarCheck, color: 'text-emerald-400' },
    { name: 'Inventory', href: '/admin/products', icon: Package, color: 'text-purple-400' },
    { name: 'Services', href: '/admin/services', icon: Wrench, color: 'text-rose-400' },
    { name: 'Customers', href: '/admin/customers', icon: UserSquare2, color: 'text-pink-400' },
    { name: 'Service Areas', href: '/admin/areas', icon: MapPin, color: 'text-cyan-400' },
    { name: 'Marketing', href: '/admin/marketing', icon: TicketPercent, color: 'text-yellow-400' },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, color: 'text-indigo-400' },
    { name: 'Couriers', href: '/admin/couriers', icon: Truck, color: 'text-sky-400' },
    { name: 'Subscription', href: '/admin/subscription', icon: CreditCard, color: 'text-lime-400' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'text-slate-400' },
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
      {/* Collapsible Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 bg-[#081621] text-white transition-all duration-300 z-30",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10 h-16 relative">
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden transition-all duration-300">
              <div className="p-2 bg-primary rounded-lg text-white shrink-0"><ShieldCheck size={20} /></div>
              <div className="truncate">
                <h1 className="font-bold tracking-tight text-sm">ERP PORTAL</h1>
                <p className="text-[9px] text-gray-400 uppercase font-black">Smart Clean</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 bg-primary rounded-lg text-white mx-auto"><ShieldCheck size={20} /></div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white hover:bg-white/10 absolute -right-4 top-14 bg-[#081621] border border-white/10 rounded-full h-8 w-8 z-40 hidden lg:flex shadow-xl"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 mt-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl transition-all group relative",
                pathname === item.href ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white",
                isCollapsed ? "justify-center" : "justify-between"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon 
                  size={18} 
                  className={cn(
                    "shrink-0 transition-colors duration-300",
                    pathname === item.href ? "text-white" : item.color
                  )} 
                />
                {!isCollapsed && <span className="text-sm font-semibold truncate">{item.name}</span>}
              </div>
              {!isCollapsed && pathname === item.href && <ChevronRight size={14} className="opacity-50" />}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-2xl border border-white/10">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-gray-400 hover:text-destructive gap-3 transition-all",
              isCollapsed ? "justify-center" : "justify-start"
            )} 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-semibold text-sm">Logout</span>}
          </Button>
        </div>
      </aside>

      <main 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}
      >
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {NAV_ITEMS.find(i => i.href === pathname)?.name || 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-gray-900">{user.email?.split('@')[0]}</p>
               <p className="text-[9px] text-primary font-black uppercase tracking-tighter">System Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
