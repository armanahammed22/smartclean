
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Lock,
  MapPin,
  BarChart3,
  TicketPercent,
  Menu,
  Paintbrush,
  ShoppingCart,
  Truck,
  Package,
  Wrench,
  Tags,
  HelpCircle,
  Share2,
  AlertCircle,
  CreditCard,
  Briefcase,
  Calendar,
  Grid,
  Zap,
  Wallet,
  Globe,
  UserCheck,
  Headphones,
  Settings2,
  Bell,
  Box,
  Layers,
  Shapes,
  ListChecks,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';

const BOOTSTRAP_ADMIN_UID = 'gcp03WmpjROVvRdpLNsghNU4zHa2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const isAuthorized = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID;

  // Active Purge: Logout non-admins trying to access admin portal
  useEffect(() => {
    if (!isUserLoading && !roleLoading && user && !isAuthorized) {
      toast({ variant: "destructive", title: "Access Denied", description: "Admin session required. Logging out..." });
      signOut(auth).then(() => {
        router.push('/login');
      });
    }
  }, [isAuthorized, isUserLoading, roleLoading, user, auth, router, toast]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const NAV_GROUPS = [
    {
      title: "Dashboard",
      items: [
        { name: "Dashboard", href: '/admin/dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: "Reports", href: '/admin/reports', icon: BarChart3, color: 'text-cyan-400' },
      ]
    },
    {
      title: "Orders & Booking",
      items: [
        { name: "Product Orders", href: '/admin/orders', icon: ShoppingCart, color: 'text-amber-400' },
        { name: "Service Booking", href: '/admin/bookings', icon: Calendar, color: 'text-blue-400' },
        { name: "Order Tracking", href: '/admin/couriers', icon: Truck, color: 'text-emerald-400' },
      ]
    },
    {
      title: "Inventory",
      items: [
        { name: "Products", href: '/admin/products', icon: Box, color: 'text-indigo-400' },
        { name: "Categories", href: '/admin/products/categories', icon: Tags, color: 'text-rose-400' },
      ]
    },
    {
      title: "Services",
      items: [
        { name: "Service List", href: '/admin/services', icon: Wrench, color: 'text-blue-500' },
        { name: "Sub Services", href: '/admin/services/sub-services', icon: Grid, color: 'text-sky-500' },
        { name: "Service Areas", href: '/admin/areas', icon: MapPin, color: 'text-red-400' },
      ]
    },
    {
      title: "Attributes & Brands",
      items: [
        { name: "Brands", href: '/admin/attributes/brands', icon: Globe, color: 'text-pink-400' },
        { name: "Variants", href: '/admin/attributes/variants', icon: Shapes, color: 'text-violet-400' },
        { name: "Key Features", href: '/admin/attributes/features', icon: ListChecks, color: 'text-teal-400' },
        { name: "Specifications", href: '/admin/attributes/specifications', icon: Settings2, color: 'text-slate-400' },
      ]
    },
    {
      title: "CRM & Users",
      items: [
        { name: "Customer Directory", href: '/admin/customers', icon: UserSquare2, color: 'text-yellow-400' },
        { name: "Staff Directory", href: '/admin/employees', icon: Users, color: 'text-green-400' },
        { name: "Access Control", href: '/admin/roles', icon: Lock, color: 'text-red-500' },
      ]
    },
    {
      title: "Marketing",
      items: [
        { name: "Campaigns", href: '/admin/marketing', icon: Zap, color: 'text-orange-500' },
        { name: "Referral Program", href: '/admin/referrals', icon: Share2, color: 'text-purple-400' },
      ]
    },
    {
      title: "System",
      items: [
        { name: "Payment Management", href: '/admin/payments', icon: Wallet, color: 'text-emerald-500' },
        { name: "Global Settings", href: '/admin/settings', icon: Settings, color: 'text-gray-400' },
        { name: "Site Customize", href: '/admin/customize', icon: Paintbrush, color: 'text-violet-500' },
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Support Hub", href: '/admin/support-hub', icon: Headphones, color: 'text-teal-400' },
        { name: "Support Tickets", href: '/admin/support', icon: HelpCircle, color: 'text-rose-400' },
      ]
    }
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

  if (!user || !isAuthorized) return null;

  const SidebarContent = ({ collapsed, mobileOnly }: { collapsed?: boolean, mobileOnly?: boolean }) => (
    <>
      <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0 bg-[#081621]">
        <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed && "justify-center w-full")}>
          <div className="p-2.5 bg-primary rounded-2xl text-white shrink-0 shadow-lg shadow-primary/20"><ShieldCheck size={22} /></div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-black tracking-tighter text-sm text-white">ADMIN PORTAL</h1>
              <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-none mt-0.5">Smart Clean</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar bg-gradient-to-b from-[#081621] to-[#050d14]">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {!collapsed && (
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-4 mb-3">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-xl transition-all group relative h-11",
                    pathname === item.href 
                      ? "bg-primary text-white shadow-xl shadow-primary/20" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                    collapsed ? "justify-center" : "justify-start"
                  )}
                >
                  <item.icon 
                    size={collapsed ? 22 : 18} 
                    className={cn(
                      "shrink-0 transition-colors duration-300",
                      pathname === item.href ? "text-white" : item.color,
                      !collapsed && "mr-3"
                    )} 
                  />
                  {!collapsed && <span className="text-xs font-bold truncate tracking-tight">{item.name}</span>}
                  
                  {pathname === item.href && !collapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!mobileOnly && (
        <div className="p-4 border-t border-white/5 shrink-0 mb-16 lg:mb-0 bg-[#050d14]">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-gray-400 hover:text-destructive hover:bg-red-500/10 gap-3 transition-all rounded-xl h-12",
              collapsed ? "justify-center" : "justify-start"
            )} 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">Sign Out</span>}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-full bg-[#081621] text-white transition-all duration-300 z-30 relative shadow-2xl",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-4 top-24 bg-white border border-gray-100 rounded-full h-8 w-8 z-40 hidden lg:flex shadow-xl text-gray-400 hover:text-primary transition-all hover:scale-110"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-600 rounded-xl hover:bg-gray-50">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#081621] border-none w-64 shadow-2xl">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full text-white">
                  <SidebarContent mobileOnly />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Navigation</h2>
              <span className="text-sm font-bold text-gray-900 leading-none">
                {NAV_GROUPS.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Admin Console'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Quick Search..." 
                className="bg-gray-50 border-none rounded-full h-9 pl-9 pr-4 text-xs font-medium w-48 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-primary gap-2 h-9 px-3 rounded-xl hover:bg-primary/5"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{language === 'bn' ? "EN" : "বাং"}</span>
            </Button>
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar">
          {children}
        </main>

        <AdminBottomNav />
      </div>
    </div>
  );
}
