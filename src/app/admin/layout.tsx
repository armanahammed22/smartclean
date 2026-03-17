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
  Loader2,
  Lock,
  MapPin,
  BarChart3,
  Menu,
  Paintbrush,
  ShoppingCart,
  Truck,
  Package,
  Wrench,
  Tags,
  HelpCircle,
  Share2,
  Calendar,
  Grid,
  Zap,
  Wallet,
  Globe,
  Settings2,
  Box,
  Shapes,
  ListChecks,
  Search,
  Headphones
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
      title: t('group_dashboard'),
      items: [
        { name: t('item_dashboard'), href: '/admin/dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
        { name: t('item_reports'), href: '/admin/reports', icon: BarChart3, color: 'text-cyan-400' },
      ]
    },
    {
      title: t('group_orders'),
      items: [
        { name: t('item_orders'), href: '/admin/orders', icon: ShoppingCart, color: 'text-amber-400' },
        { name: t('item_bookings'), href: '/admin/bookings', icon: Calendar, color: 'text-blue-400' },
        { name: t('item_tracking'), href: '/admin/couriers', icon: Truck, color: 'text-emerald-400' },
      ]
    },
    {
      title: t('group_inventory'),
      items: [
        { name: t('item_products'), href: '/admin/products', icon: Box, color: 'text-indigo-400' },
        { name: t('item_categories'), href: '/admin/products/categories', icon: Tags, color: 'text-rose-400' },
      ]
    },
    {
      title: t('group_services'),
      items: [
        { name: t('item_services'), href: '/admin/services', icon: Wrench, color: 'text-blue-500' },
        { name: t('item_subservices'), href: '/admin/services/sub-services', icon: Grid, color: 'text-sky-500' },
        { name: t('item_areas'), href: '/admin/areas', icon: MapPin, color: 'text-red-400' },
      ]
    },
    {
      title: t('group_attributes'),
      items: [
        { name: t('item_brands'), href: '/admin/attributes/brands', icon: Globe, color: 'text-pink-400' },
        { name: t('item_variants'), href: '/admin/attributes/variants', icon: Shapes, color: 'text-violet-400' },
        { name: t('item_features'), href: '/admin/attributes/features', icon: ListChecks, color: 'text-teal-400' },
        { name: t('item_specs'), href: '/admin/attributes/specifications', icon: Settings2, color: 'text-slate-400' },
      ]
    },
    {
      title: t('group_crm'),
      items: [
        { name: t('item_customers'), href: '/admin/customers', icon: UserSquare2, color: 'text-yellow-400' },
        { name: t('item_staff'), href: '/admin/employees', icon: Users, color: 'text-green-400' },
        { name: t('item_roles'), href: '/admin/roles', icon: Lock, color: 'text-red-500' },
      ]
    },
    {
      title: t('group_marketing'),
      items: [
        { name: t('item_campaigns'), href: '/admin/marketing', icon: Zap, color: 'text-orange-500' },
        { name: t('item_referrals'), href: '/admin/referrals', icon: Share2, color: 'text-purple-400' },
      ]
    },
    {
      title: t('group_system'),
      items: [
        { name: t('item_payments'), href: '/admin/payments', icon: Wallet, color: 'text-emerald-500' },
        { name: t('item_settings'), href: '/admin/settings', icon: Settings, color: 'text-gray-400' },
        { name: t('item_customize'), href: '/admin/customize', icon: Paintbrush, color: 'text-violet-500' },
      ]
    },
    {
      title: t('group_support'),
      items: [
        { name: t('item_supporthub'), href: '/admin/support-hub', icon: Headphones, color: 'text-teal-400' },
        { name: t('item_tickets'), href: '/admin/support', icon: HelpCircle, color: 'text-rose-400' },
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
      <div className="p-4 flex items-center justify-between border-b border-white/5 h-16 shrink-0 bg-[#081621]">
        <div className={cn("flex items-center gap-2.5 transition-all duration-300", collapsed && "justify-center w-full")}>
          <div className="p-2 bg-primary rounded-xl text-white shrink-0 shadow-lg shadow-primary/20"><ShieldCheck size={18} /></div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-black tracking-tighter text-xs text-white">ADMIN PORTAL</h1>
              <p className="text-[8px] text-primary font-black uppercase tracking-widest leading-none mt-0.5">Smart Clean</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar bg-gradient-to-b from-[#081621] to-[#050d14]">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] px-3 mb-1">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-1.5 rounded-lg transition-all group relative h-9",
                    pathname === item.href 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                    collapsed ? "justify-center" : "justify-start"
                  )}
                >
                  <item.icon 
                    size={collapsed ? 20 : 16} 
                    className={cn(
                      "shrink-0 transition-colors duration-300",
                      pathname === item.href ? "text-white" : item.color,
                      !collapsed && "mr-3"
                    )} 
                  />
                  {!collapsed && <span className="text-[11px] font-bold truncate tracking-tight">{item.name}</span>}
                  
                  {pathname === item.href && !collapsed && (
                    <div className="absolute right-2 w-1 h-1 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!mobileOnly && (
        <div className="p-3 border-t border-white/5 shrink-0 mb-16 lg:mb-0 bg-[#050d14]">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-gray-400 hover:text-destructive hover:bg-red-500/10 gap-3 transition-all rounded-lg h-10",
              collapsed ? "justify-center" : "justify-start"
            )} 
            onClick={handleLogout}
          >
            <LogOut size={18} />
            {!collapsed && <span className="font-black text-[9px] uppercase tracking-widest">{t('sign_out')}</span>}
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
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3 top-20 bg-white border border-gray-100 rounded-full h-6 w-6 z-40 hidden lg:flex shadow-xl text-gray-400 hover:text-primary transition-all hover:scale-110"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-600 rounded-lg hover:bg-gray-50">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#081621] border-none w-60 shadow-2xl">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full text-white">
                  <SidebarContent mobileOnly />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-0.5">Navigation</h2>
              <span className="text-xs font-bold text-gray-900 leading-none">
                {NAV_GROUPS.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Admin Console'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className="bg-gray-50 border-none rounded-full h-8 pl-8 pr-3 text-[11px] font-medium w-40 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-primary gap-1.5 h-8 px-2 rounded-lg hover:bg-primary/5"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">{language === 'bn' ? "EN" : "বাং"}</span>
            </Button>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs border-2 border-white shadow-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB] pb-24 lg:pb-8 custom-scrollbar">
          {children}
        </main>

        <AdminBottomNav />
      </div>
    </div>
  );
}
