
'use client';

import React, { useState } from 'react';
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
  Award,
  HelpCircle,
  Share2,
  Layers,
  AlertCircle,
  CreditCard,
  Briefcase,
  Calendar,
  Grid,
  Zap,
  Wallet,
  Globe
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

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const NAV_GROUPS = [
    {
      title: t('group_main'),
      items: [
        { name: t('item_dashboard'), href: '/admin/dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
        { name: t('item_reports'), href: '/admin/reports', icon: BarChart3, color: 'text-cyan-500' },
      ]
    },
    {
      title: t('group_crm'),
      items: [
        { name: t('item_leads'), href: '/admin/leads', icon: Briefcase, color: 'text-orange-500' },
        { name: t('item_orders'), href: '/admin/orders', icon: ShoppingCart, color: 'text-amber-500' },
        { name: t('item_bookings'), href: '/admin/bookings', icon: Calendar, color: 'text-blue-400' },
        { name: t('item_customers'), href: '/admin/customers', icon: UserSquare2, color: 'text-yellow-500' },
        { name: t('item_tickets'), href: '/admin/support', icon: HelpCircle, color: 'text-pink-500' },
      ]
    },
    {
      title: t('group_inventory'),
      items: [
        { name: t('item_products'), href: '/admin/products', icon: Package, color: 'text-emerald-500' },
        { name: t('item_categories'), href: '/admin/products/categories', icon: Tags, color: 'text-green-500' },
        { name: t('item_brands'), href: '/admin/products/brands', icon: Award, color: 'text-rose-500' },
        { name: t('item_alerts'), href: '/admin/inventory/alerts', icon: AlertCircle, color: 'text-orange-500' },
      ]
    },
    {
      title: t('group_service'),
      items: [
        { name: t('item_services'), href: '/admin/services', icon: Wrench, color: 'text-indigo-500' },
        { name: t('item_subservices'), href: '/admin/services/sub-services', icon: Layers, color: 'text-blue-600' },
        { name: t('item_areas'), href: '/admin/areas', icon: MapPin, color: 'text-red-500' },
      ]
    },
    {
      title: t('group_page'),
      items: [
        { name: t('item_links'), href: '/admin/quick-links', icon: Grid, color: 'text-indigo-400' },
        { name: t('item_actions'), href: '/admin/quick-actions', icon: Zap, color: 'text-orange-400' },
        { name: t('item_customize'), href: '/admin/customize', icon: Paintbrush, color: 'text-violet-500' },
      ]
    },
    {
      title: t('group_growth'),
      items: [
        { name: t('item_marketing'), href: '/admin/marketing', icon: TicketPercent, color: 'text-green-500' },
        { name: t('item_referrals'), href: '/admin/referrals', icon: Share2, color: 'text-purple-500' },
      ]
    },
    {
      title: t('group_system'),
      items: [
        { name: t('item_staff'), href: '/admin/employees', icon: Users, color: 'text-indigo-500' },
        { name: 'Payment Management', href: '/admin/payments', icon: Wallet, color: 'text-emerald-600' },
        { name: t('item_couriers'), href: '/admin/couriers', icon: Truck, color: 'text-slate-500' },
        { name: t('item_subscription'), href: '/admin/subscription', icon: CreditCard, color: 'text-amber-600' },
        { name: t('item_settings'), href: '/admin/settings', icon: Settings, color: 'text-gray-500' },
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
        <p className="text-muted-foreground max-w-xs mx-auto">Your account does not have admin privileges.</p>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    );
  }

  const SidebarContent = ({ collapsed, mobileOnly }: { collapsed?: boolean, mobileOnly?: boolean }) => (
    <>
      <div className="p-6 flex items-center justify-between border-b border-white/10 h-16 shrink-0">
        <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed && "justify-center w-full")}>
          <div className="p-2 bg-primary rounded-lg text-white shrink-0"><ShieldCheck size={20} /></div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold tracking-tight text-sm">CRM PORTAL</h1>
              <p className="text-[9px] text-gray-400 uppercase font-black">Smart Clean</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-2">{group.title}</p>}
            {group.items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-xl transition-all group relative",
                  pathname === item.href ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                <item.icon 
                  size={collapsed ? 20 : 18} 
                  className={cn(
                    "shrink-0 transition-colors duration-300",
                    pathname === item.href ? "text-white" : item.color,
                    !collapsed && "mr-3"
                  )} 
                />
                {!collapsed && <span className="text-xs font-bold truncate">{item.name}</span>}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {!mobileOnly && (
        <div className="p-4 border-t border-white/10 shrink-0 mb-16 lg:mb-0">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-gray-400 hover:text-destructive gap-3 transition-all",
              collapsed ? "justify-center" : "justify-start"
            )} 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-bold text-xs">Logout</span>}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-full bg-[#081621] text-white transition-all duration-300 z-30 relative",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-4 top-20 bg-white border rounded-full h-8 w-8 z-40 hidden lg:flex shadow-md text-gray-400 hover:text-primary"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-600">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#081621] border-none w-64">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full text-white">
                  <SidebarContent mobileOnly />
                </div>
              </SheetContent>
            </Sheet>
            <h2 className="text-sm font-bold text-gray-900">
              {NAV_GROUPS.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-primary gap-2 h-9 px-3"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={18} />
              <span className="text-xs font-bold">{language === 'bn' ? "English" : "বাংলা"}</span>
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB] pb-24 lg:pb-8">
          {children}
        </main>

        <AdminBottomNav />
      </div>
    </div>
  );
}
