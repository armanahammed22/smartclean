
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
  MousePointer2,
  FileText,
  Plus,
  Tag,
  Palette,
  AlertCircle,
  Search,
  MessageCircle,
  List,
  Megaphone,
  LayoutGrid,
  Target,
  TicketPercent,
  ImageIcon,
  ShieldAlert,
  Wrench,
  Layers,
  HardHat,
  Briefcase,
  Sparkles,
  Award,
  Shapes,
  ListChecks,
  Settings2,
  CalendarCheck,
  Activity,
  Code,
  Shield
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
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();

  const isLoginPage = pathname === '/admin/login';

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const isAuthorized = !!adminRole || (user?.uid === BOOTSTRAP_ADMIN_UID) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  /**
   * REAL-TIME NOTIFICATION COUNTS
   */
  const pendingErrorsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'error_logs'), where('status', '==', 'pending')) : null, [db, isAuthorized]);
  const newOrdersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const newBookingsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'bookings'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const newLeadsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'leads'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const openTicketsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'support_tickets'), where('status', '==', 'Open')) : null, [db, isAuthorized]);

  const { data: pendingErrors } = useCollection(pendingErrorsQuery);
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
        { name: "Reports", href: '/admin/reports', icon: BarChart3 },
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
      title: "MARKETING INTELLIGENCE",
      icon: Target,
      color: "text-rose-400",
      items: [
        { name: "Analytics Overview", href: '/admin/marketing/overview', icon: TrendingUp },
        { name: "Pixel Config", href: '/admin/marketing/pixel', icon: Code },
        { name: "CAPI Sync", href: '/admin/marketing/capi', icon: Shield },
        { name: "Attribution Logs", href: '/admin/marketing/logs', icon: FileText },
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
      id: 'promotions',
      title: "OFFER & PROMOTION",
      icon: Zap,
      color: "text-violet-400",
      items: [
        { name: "Mega Sale Campaigns", href: '/admin/campaigns', icon: Megaphone },
        { name: "Navbar Banners", href: '/admin/offers/navbar-banners', icon: LayoutGrid },
        { name: "Homepage Banners", href: '/admin/offers/homepage-banners', icon: ImageIcon },
        { name: "Coupon Codes", href: '/admin/offers/coupons', icon: TicketPercent },
        { name: "Referrals", href: '/admin/referrals', icon: Share2 },
      ]
    },
    {
      id: 'ai_agents',
      title: "AI AGENTS",
      icon: Sparkles,
      color: "text-violet-400",
      items: [
        { name: "AI Sales Desk", href: '/admin/ai/sales', icon: MessageCircle },
        { name: "AI Booking Assistant", href: '/admin/ai/booking', icon: CalendarCheck },
      ]
    },
    {
      id: 'customize',
      title: "SITE CUSTOMIZE",
      icon: Palette,
      color: "text-pink-400",
      items: [
        { name: "Hero Banners", href: '/admin/customize/hero', icon: Layout },
        { name: "Top Categories", href: '/admin/customize/top-categories', icon: List },
        { name: "Quick Link", href: '/admin/customize/quick-links', icon: LinkIcon },
        { name: "Quick Action", href: '/admin/customize/quick-actions', icon: MousePointer2 },
        { name: "Homepage Sections", href: '/admin/customize/sections', icon: Grid },
        { name: "Dynamic Pages", href: '/admin/pages', icon: FileText },
      ]
    },
    {
      id: 'system',
      title: "SYSTEM",
      icon: Settings,
      color: "text-orange-400",
      items: [
        { name: "Payments", href: '/admin/payments', icon: Wallet },
        { name: "Delivery Settings", href: '/admin/settings/delivery', icon: Truck },
        { name: "Settings", href: '/admin/settings', icon: Settings },
        { 
          name: "Error Logs", 
          href: '/admin/error-logs', 
          icon: ShieldAlert,
          badge: pendingErrors?.length || 0 
        },
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
  ], [newOrders, newBookings, newLeads, openTickets, pendingErrors]);

  useEffect(() => {
    if (isLoginPage) return;
    if (!isUserLoading && !user) {
      router.replace('/admin/login');
    }
  }, [user, isUserLoading, router, isLoginPage]);

  useEffect(() => {
    if (isLoginPage || isUserLoading || roleLoading) return;
    if (user && !isAuthorized) {
      toast({ variant: "destructive", title: "Access Denied", description: "Admin session required." });
      signOut(auth).then(() => {
        router.replace('/admin/login');
      });
    }
  }, [isAuthorized, isUserLoading, roleLoading, user, auth, router, toast, isLoginPage]);

  useEffect(() => {
    const activeGroup = NAV_GROUPS.find(group => 
      group.items.some(item => pathname === item.href)
    );
    if (activeGroup) {
      setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [pathname, NAV_GROUPS]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/admin/login');
    }
  };

  const SidebarContent = ({ collapsed, mobileOnly }: { collapsed?: boolean, mobileOnly?: boolean }) => (
    <div className="flex flex-col h-full bg-[#08101b] text-white relative overflow-hidden">
      <div className="absolute top-[-10%] -right-[20%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] -left-[20%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0 relative z-10 backdrop-blur-md bg-white/5">
        <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed && "justify-center w-full")}>
          <div className="p-2.5 bg-gradient-to-br from-primary to-emerald-400 rounded-xl text-white shrink-0 shadow-lg shadow-primary/20 border border-white/10">
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-black tracking-tighter text-sm text-white uppercase leading-none">Admin Pro</h1>
              <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-none mt-1">Management Center</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-3 custom-scrollbar relative z-10">
        {NAV_GROUPS.map((group) => {
          const isGroupExpanded = expandedGroups[group.id];
          const isGroupActive = group.items.some(item => pathname === item.href);
          
          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3.5 rounded-2xl transition-all duration-300 text-left group hover:scale-[1.02] border border-transparent",
                  isGroupActive 
                    ? "bg-white/10 text-white shadow-xl" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={18} className={cn("shrink-0 transition-colors", isGroupActive ? group.color : "text-white/20 group-hover:text-white/60")} />
                  {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.15em]">{group.title}</span>}
                </div>
                {!collapsed && (
                  <div className={cn("shrink-0 transition-transform duration-300", isGroupExpanded ? "rotate-90" : "rotate-0")}>
                    <ChevronRight size={14} className="opacity-40" />
                  </div>
                )}
              </button>

              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out pl-4",
                isGroupExpanded && !collapsed ? "max-h-[800px] opacity-100 mt-2" : "max-h-0 opacity-0"
              )}>
                <div className="space-y-1 border-l border-white/5 pl-3">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => mobileOnly && setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 group relative h-10 hover:translate-x-1",
                          isActive 
                            ? "bg-white text-gray-900 shadow-lg font-black" 
                            : "text-white/50 hover:text-white"
                        )}
                      >
                        <item.icon size={16} className={cn("shrink-0 mr-3 transition-colors", isActive ? group.color : "text-white/20 group-hover:" + group.color)} />
                        <span className="text-[11px] font-bold truncate tracking-tight">{item.name}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={cn(
                            "absolute right-3 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-[9px] font-black text-white shadow-lg",
                            group.id === 'orders' ? "bg-emerald-500" : 
                            group.id === 'system' ? "bg-orange-500" : 
                            group.id === 'crm' ? "bg-purple-500" : 
                            group.id === 'marketing' ? "bg-rose-500" :
                            "bg-primary"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5 shrink-0 relative z-10 backdrop-blur-md bg-white/5">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-white/40 hover:text-red-400 hover:bg-red-500/10 gap-3 transition-all duration-300 rounded-xl h-12",
            collapsed ? "justify-center" : "justify-start"
          )} 
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {!collapsed && <span className="font-black text-[10px] uppercase tracking-[0.2em]">Logout</span>}
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || (user && (roleLoading))) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verifying Admin Access...</p>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  if (!user || !isAuthorized) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-full bg-[#08101b] shadow-2xl transition-all duration-300 z-30 relative",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3 top-24 bg-primary border-2 border-[#08101b] rounded-full h-7 w-7 z-40 hidden lg:flex shadow-xl text-white hover:bg-emerald-400 transition-all"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-600 rounded-xl h-10 w-10">
                  <Menu size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#08101b] border-none w-72 shadow-2xl overflow-hidden">
                <SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>
                <SidebarContent mobileOnly />
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 leading-none mb-1">Navigation</h2>
              <span className="text-xs font-bold text-gray-900 leading-none flex items-center gap-2">
                Active Module
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-600 hover:text-primary gap-2 h-10 px-3 rounded-xl font-bold" onClick={() => router.push('/')}>
              <Globe size={18} />
              <span className="text-[10px] font-black tracking-widest uppercase">Live Site</span>
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-400/10 text-primary flex items-center justify-center font-black text-xs border-2 border-white shadow-md">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar">
          {children}
        </main>

        <AdminBottomNav />
      </div>
    </div>
  );
}
