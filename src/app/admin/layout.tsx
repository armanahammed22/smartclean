
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Loader2,
  BarChart3,
  Menu,
  ShoppingCart,
  Truck,
  Box,
  Tags,
  Share2,
  Calendar,
  Grid,
  Zap,
  Wallet,
  Globe,
  Headphones,
  Layout,
  Link as LinkIcon,
  FileText,
  Plus,
  Palette,
  AlertCircle,
  MessageCircle,
  List,
  Megaphone,
  LayoutGrid,
  Target,
  TicketPercent,
  HardHat,
  Briefcase,
  Award,
  Shapes,
  ListChecks,
  Settings2,
  Code,
  Shield,
  TrendingUp,
  FileSpreadsheet,
  Wrench,
  Layers,
  MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, query, where } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { useToast } from '@/hooks/use-toast';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ dashboard: true });
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const isAuthorized = !!adminRole || (user?.uid === BOOTSTRAP_ADMIN_UID) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  const newOrdersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const newBookingsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'bookings'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const newLeadsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'leads'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const openTicketsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'support_tickets'), where('status', '==', 'Open')) : null, [db, isAuthorized]);

  const { data: newOrders } = useCollection(newOrdersQuery);
  const { data: newBookings } = useCollection(newBookingsQuery);
  const { data: newLeads } = useCollection(newLeadsQuery);
  const { data: openTickets } = useCollection(openTicketsQuery);

  const NAV_GROUPS = useMemo(() => [
    {
      id: 'dashboard',
      title: "DASHBOARD",
      icon: LayoutDashboard,
      color: "text-blue-400",
      items: [
        { name: "Dashboard", href: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      id: 'orders',
      title: "ORDER & BOOKING",
      icon: ShoppingCart,
      color: "text-emerald-400",
      items: [
        { name: "Product Orders", href: '/admin/orders', icon: ShoppingCart, badge: newOrders?.length || 0 },
        { name: "Service Bookings", href: '/admin/bookings', icon: Calendar, badge: newBookings?.length || 0 },
        { name: "Logistics Hub", href: '/admin/couriers', icon: Truck },
      ]
    },
    {
      id: 'inventory',
      title: "INVENTORY",
      icon: Box,
      color: "text-amber-400",
      items: [
        { name: "Products", href: '/admin/products', icon: Box },
        { name: "Categories", href: '/admin/products/categories', icon: Tags },
        { name: "Stock Alerts", href: '/admin/inventory/alerts', icon: AlertCircle },
        { name: "Brands", href: '/admin/attributes/brands', icon: Award },
        { name: "Variants", href: '/admin/attributes/variants', icon: Shapes },
        { name: "Key Features", href: '/admin/attributes/features', icon: ListChecks },
        { name: "Technical Specs", href: '/admin/attributes/specifications', icon: Settings2 },
      ]
    },
    {
      id: 'services',
      title: "SERVICES",
      icon: Wrench,
      color: "text-indigo-400",
      items: [
        { name: "Service List", href: '/admin/services', icon: Wrench },
        { name: "Sub Services", href: '/admin/services/sub-services', icon: Layers },
        { name: "Service Areas", href: '/admin/areas', icon: Globe },
      ]
    },
    {
      id: 'marketing',
      title: "MARKETING",
      icon: Target,
      color: "text-rose-400",
      items: [
        { name: "Analytics Overview", href: '/admin/marketing/overview', icon: TrendingUp },
        { name: "Landing Pages", href: '/admin/marketing/landing-pages', icon: FileSpreadsheet },
        { name: "Conversion Pixel", href: '/admin/marketing/pixel', icon: Code },
        { name: "CAPI Sync", href: '/admin/marketing/capi', icon: Shield },
      ]
    },
    {
      id: 'promotions',
      title: "OFFER & COUPONS",
      icon: Zap,
      color: "text-violet-400",
      items: [
        { name: "Mega Sale Campaigns", href: '/admin/campaigns', icon: Megaphone },
        { name: "Coupon Codes", href: '/admin/offers/coupons', icon: TicketPercent },
        { name: "Navbar Banners", href: '/admin/offers/navbar-banners', icon: LayoutGrid },
        { name: "Referrals", href: '/admin/referrals', icon: Share2 },
      ]
    },
    {
      id: 'crm',
      title: "CRM & USERS",
      icon: Users,
      color: "text-purple-400",
      items: [
        { name: "Customer Directory", href: '/admin/customers', icon: Users },
        { name: "Sales Leads", href: '/admin/leads', icon: Briefcase, badge: newLeads?.length || 0 },
        { name: "Staff Directory", href: '/admin/employees', icon: HardHat },
        { name: "Access Control", href: '/admin/roles', icon: ShieldCheck },
      ]
    },
    {
      id: 'portals',
      title: "INTERNAL PORTALS",
      icon: Globe,
      color: "text-sky-400",
      items: [
        { name: "Staff App Portal", href: '/staff/dashboard', icon: HardHat },
      ]
    },
    {
      id: 'reports',
      title: "BUSINESS REPORTS",
      icon: BarChart3,
      color: "text-blue-400",
      items: [
        { name: "Business Reports", href: '/admin/reports', icon: BarChart3 },
      ]
    },
    {
      id: 'customize',
      title: "SITE CUSTOMIZE",
      icon: Palette,
      color: "text-pink-400",
      items: [
        { name: "Homepage Builder", href: '/admin/customize/homepage-builder', icon: MousePointer2 },
        { name: "Layout & Theme", href: '/admin/customize/theme', icon: Palette },
        { name: "Hero Banners", href: '/admin/customize/hero', icon: Layout },
        { name: "Top Categories", href: '/admin/customize/top-categories', icon: List },
        { name: "Quick Links", href: '/admin/customize/quick-links', icon: LinkIcon },
        { name: "Dynamic Pages", href: '/admin/pages', icon: FileText },
      ]
    },
    {
      id: 'system',
      title: "SYSTEM",
      icon: Settings,
      color: "text-orange-400",
      items: [
        { name: "Global Settings", href: '/admin/settings', icon: Settings },
        { name: "Payment Gateways", href: '/admin/payments', icon: Wallet },
        { name: "Delivery Fees", href: '/admin/settings/delivery', icon: Truck },
      ]
    },
    {
      id: 'support',
      title: "SUPPORT",
      icon: Headphones,
      color: "text-sky-400",
      items: [
        { name: "Support Hub", href: '/admin/support-hub', icon: Headphones },
        { name: "Support Tickets", href: '/admin/support', icon: MessageCircle, badge: openTickets?.length || 0 },
      ]
    }
  ], [newOrders, newBookings, newLeads, openTickets]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isUserLoading || roleLoading) return;
    if (user && !isAuthorized) {
      toast({ variant: "destructive", title: "Unauthorized", description: "Admin access only." });
      router.replace('/login');
    }
  }, [isAuthorized, isUserLoading, roleLoading, user, router, toast]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.replace('/login');
    }
  };

  const SidebarContent = ({ collapsed }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-[#08101b] text-white overflow-hidden">
      <div className="p-6 flex items-center gap-3 border-b border-white/5 h-20 shrink-0">
        <div className="p-2.5 bg-gradient-to-br from-primary to-emerald-400 rounded-xl text-white shadow-lg border border-white/10">
          <ShieldCheck size={20} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-black text-sm uppercase leading-none">Admin App</h1>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Smart Control</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-3 custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            <button
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-white/40 hover:bg-white/5 hover:text-white",
                group.items.some(item => pathname === item.href) && "bg-white/10 text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <group.icon size={18} className={cn("shrink-0", group.items.some(item => pathname === item.href) ? group.color : "opacity-40")} />
                {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">{group.title}</span>}
              </div>
              {!collapsed && <ChevronRight size={14} className={cn("transition-transform", expandedGroups[group.id] ? "rotate-90" : "")} />}
            </button>

            {expandedGroups[group.id] && !collapsed && (
              <div className="pl-4 mt-1 space-y-1 border-l border-white/5 ml-3">
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all relative",
                      pathname === item.href ? "bg-white text-[#081621] shadow-lg" : "text-white/50 hover:text-white"
                    )}
                  >
                    <item.icon size={14} className="mr-3 opacity-60" />
                    {item.name}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute right-3 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">{item.badge}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12">
              <LogOut size={18} className="mr-3" />
              {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">Logout System</span>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem] max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-red-600 flex items-center gap-2">
                <LogOut size={20} /> Logout Admin?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium leading-relaxed">
                Are you sure you want to end your administrative session? You will need to login again to access the control center.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4 flex gap-2">
              <AlertDialogCancel className="rounded-xl flex-1 font-bold">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-black uppercase text-xs tracking-widest">
                Logout Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  if (isUserLoading || roleLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verifying Admin Terminal...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside className={cn("hidden lg:flex flex-col h-full bg-[#08101b] transition-all duration-300", isCollapsed ? "w-20" : "w-72")}>
        <SidebarContent collapsed={isCollapsed} />
        <Button variant="ghost" size="icon" className="absolute -right-3 top-24 bg-primary text-white rounded-full h-7 w-7 shadow-xl z-50" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10"><Menu size={22} /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#08101b] border-none w-72"><SidebarContent /></SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-400">Admin App</span>
              <span className="text-xs font-bold text-gray-900 flex items-center gap-2">Terminal active <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-600 gap-2 h-10 px-3 rounded-xl font-bold" asChild><Link href="/"><Globe size={18} /><span className="text-[10px] font-black uppercase">Live Site</span></Link></Button>
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-md">{user?.email?.[0].toUpperCase()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full">{children}</div>
        </main>

        <AdminBottomNav />
      </div>
    </div>
  );
}
