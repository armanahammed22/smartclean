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
  ShieldCheck,
  Loader2,
  BarChart3,
  Menu,
  ShoppingCart,
  Truck,
  Box,
  Tags,
  Zap,
  Globe,
  Headphones,
  Layout,
  FileText,
  Plus,
  Palette,
  AlertCircle,
  MessageCircle,
  List,
  Megaphone,
  Target,
  TicketPercent,
  HardHat,
  Briefcase,
  Award,
  Shapes,
  Layers,
  MousePointer2,
  Store,
  CheckCircle,
  Wrench,
  Smartphone,
  Code,
  Calendar,
  Languages,
  Activity,
  History,
  Navigation,
  Grid,
  TrendingUp,
  ImageIcon,
  Bot,
  Sparkles,
  MapPin,
  ClipboardList,
  ArrowLeft,
  CreditCard,
  Search,
  ChevronDown,
  BarChart,
  Terminal,
  Trophy,
  Wallet,
  Crown,
  Handshake,
  Building2,
  UserCheck,
  DollarSign,
  ReceiptText,
  ShieldAlert,
  Package
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
} from "@/components/ui/alert-dialog";
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92', 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

const STORAGE_KEY = 'admin_sidebar_collapsed';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 
    sales: true, 
    finance: false,
    orders: true, 
    services: true,
    partners: false,
    vendors: false,
    marketing: true,
    seo: false
  });
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const sidebarConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(sidebarConfigRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState !== null) setIsCollapsed(savedState === 'true');
      setMounted(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(STORAGE_KEY, String(newState));
  };

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid)) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const NAV_GROUPS = useMemo(() => {
    // 1. Define Master List of Groups
    let groups = [
      {
        id: 'dashboard_link',
        title: "DASHBOARD",
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        color: "text-indigo-400",
        items: []
      },
      {
        id: 'sales',
        title: "SALES TERMINAL",
        icon: ShoppingCart,
        color: "text-rose-400",
        items: [
          { name: "New Order", href: '/admin/orders?create=true', icon: Plus, visible: productsEnabled },
          { name: "New Booking", href: '/admin/bookings?create=true', icon: Plus, visible: servicesEnabled },
        ]
      },
      {
        id: 'finance',
        title: "FINANCIAL HUB",
        icon: Wallet,
        color: "text-emerald-400",
        items: [
          { name: "Finance Overview", href: '/admin/finance', icon: TrendingUp },
          { name: "Master Ledger", href: '/admin/finance/ledger', icon: FileText },
          { name: "Bank & Cash", href: '/admin/finance/accounts', icon: Building2 },
          { name: "Staff Salaries", href: '/admin/finance/salaries', icon: DollarSign },
        ]
      },
      {
        id: 'orders',
        title: "ORDER & BOOKING",
        icon: ShoppingCart,
        color: "text-blue-400",
        items: [
          { name: "Product Orders", href: '/admin/orders', icon: Package, visible: productsEnabled },
          { name: "Service Bookings", href: '/admin/bookings', icon: Calendar, visible: servicesEnabled },
          { name: "Invoices", href: '/admin/invoices', icon: ReceiptText },
          { name: "Logistics", href: '/admin/couriers', icon: Truck, visible: productsEnabled },
        ]
      },
      {
        id: 'services',
        title: "SERVICES",
        icon: Wrench,
        color: "text-sky-400",
        visible: servicesEnabled,
        items: [
          { name: "Service List", href: '/admin/services', icon: Wrench },
          { name: "Custom Requests", href: '/admin/services/custom-requests', icon: ClipboardList },
          { name: "Sub-Services", href: '/admin/services/sub-services', icon: Layers },
          { name: "Service Areas", href: '/admin/areas', icon: Globe },
          { name: "Billing & Plan", href: '/admin/subscription', icon: Wallet },
        ]
      },
      {
        id: 'partners',
        title: "B2B PARTNERS",
        icon: Handshake,
        color: "text-amber-400",
        items: [
          { name: "Partner Directory", href: '/admin/partners', icon: Building2 },
          { name: "Commission Logic", href: '/admin/partners/commissions', icon: DollarSign },
          { name: "Project Costing", href: '/admin/partners/projects', icon: Briefcase },
        ]
      },
      {
        id: 'vendors',
        title: "VENDOR HUB",
        icon: Store,
        color: "text-orange-400",
        items: [
          { name: "Vendor Directory", href: '/admin/vendors', icon: Users },
          { name: "Product Approvals", href: '/admin/products/approvals', icon: CheckCircle, visible: productsEnabled },
          { name: "Service Approvals", href: '/admin/services/approvals', icon: CheckCircle, visible: servicesEnabled },
          { name: "Settlements", href: '/admin/vendors/commissions', icon: Wallet },
        ]
      },
      {
        id: 'marketing',
        title: "MARKETING & PROMOTIONS",
        icon: Target,
        color: "text-pink-400",
        items: [
          { name: "Intel Overview", href: '/admin/marketing/overview', icon: Activity },
          { name: "Landing Pages", href: '/admin/marketing/landing-pages', icon: Layout },
          { name: "Campaign Mgmt", href: '/admin/campaigns', icon: Megaphone },
          { name: "Tracking Hub", href: '/admin/seo/tracking-hub', icon: ShieldCheck },
          { name: "Affiliate System", href: '/admin/referrals', icon: Award, visible: servicesEnabled },
        ]
      },
      {
        id: 'seo',
        title: "SEO & TRACKING",
        icon: Globe,
        color: "text-cyan-400",
        items: [
          { name: "Search Console", href: '/admin/seo/search-console', icon: Search },
          { name: "Meta Pixel", href: '/admin/seo/pixel', icon: Code },
          { name: "Conversion API", href: '/admin/seo/capi', icon: ShieldCheck },
          { name: "Event Logs", href: '/admin/seo/logs', icon: History },
        ]
      },
      {
        id: 'offers',
        title: "OFFER & CAMPAIGN",
        icon: TicketPercent,
        color: "text-rose-400",
        items: [
          { name: "Offer Analytics", href: '/admin/offers/analytics', icon: TrendingUp },
          { name: "Flash Sale", href: '/admin/offers/flash-sales', icon: Zap, visible: productsEnabled },
          { name: "Coupons & Promo", href: '/admin/offers/coupons', icon: TicketPercent },
          { name: "Smart Pricing", href: '/admin/offers/smart-pricing', icon: Activity, visible: servicesEnabled },
        ]
      },
      {
        id: 'crm',
        title: "CRM & USERS",
        icon: Users,
        color: "text-purple-400",
        items: [
          { name: "Customer Directory", href: '/admin/customers', icon: Users },
          { name: "Staff Directory", href: '/admin/employees', icon: HardHat },
          { name: "Access Control", href: '/admin/roles', icon: ShieldCheck },
          { name: "Sales Leads", href: '/admin/leads', icon: TrendingUp },
        ]
      },
      {
        id: 'inventory',
        title: "INVENTORY",
        icon: Box,
        color: "text-slate-400",
        visible: productsEnabled,
        items: [
          { name: "All Products", href: '/admin/products', icon: Package },
          { name: "Stock Alerts", href: '/admin/inventory/alerts', icon: AlertCircle },
          { name: "Categories", href: '/admin/products/categories', icon: Tags },
          { name: "Brands", href: '/admin/products/brands', icon: Award },
          { name: "Variants", href: '/admin/attributes/variants', icon: Shapes },
        ]
      },
      {
        id: 'reports',
        title: "BUSINESS REPORTS",
        icon: BarChart3,
        color: "text-blue-400",
        items: [
          { name: "Financial Reports", href: '/admin/reports', icon: FileText },
          { name: "Marketing Analytics", href: '/admin/marketing/analytics', icon: TrendingUp },
        ]
      },
      {
        id: 'customize',
        title: "SITE CUSTOMIZE",
        icon: Palette,
        color: "text-indigo-400",
        items: [
          { name: "Homepage Builder", href: '/admin/customize/homepage-builder', icon: Navigation },
          { name: "Hero Banners", href: '/admin/customize/hero', icon: Layout },
          { name: "Section Banners", href: '/admin/offers/homepage-banners', icon: ImageIcon },
          { name: "Bottom Navbar", href: '/admin/offers/navbar-banners', icon: Smartphone },
          { name: "Top Nav Links", href: '/admin/customize/top-categories', icon: List },
          { name: "Quick Grid", href: '/admin/quick-links', icon: Grid },
          { name: "Action Cards", href: '/admin/quick-actions', icon: Zap },
          { name: "Header & Footer", href: '/admin/customize/theme', icon: Layers },
          { name: "Dynamic Pages", href: '/admin/pages', icon: FileText },
        ]
      },
      {
        id: 'system',
        title: "SYSTEM",
        icon: Settings,
        color: "text-slate-400",
        items: [
          { name: "General Settings", href: '/admin/settings', icon: Settings },
          { name: "Localization", href: '/admin/settings/languages', icon: Globe },
          { name: "Payment Gateways", href: '/admin/payments', icon: CreditCard },
          { name: "Fleet Tracking", href: '/admin/settings/tracking', icon: MapPin },
          { name: "API & Webhooks", href: '/admin/settings/api', icon: Code },
          { name: "System Logs", href: '/admin/error-logs', icon: ShieldAlert },
        ]
      },
      {
        id: 'ai_agents',
        title: "AI AGENTS (STAFF)",
        icon: Bot,
        color: "text-blue-400",
        items: [
          { name: "AI Sales Desk", href: '/admin/ai/sales', icon: Sparkles },
          { name: "AI Booking Assistant", href: '/admin/ai/booking', icon: Sparkles },
        ]
      },
      {
        id: 'support',
        title: "SUPPORT",
        icon: MessageCircle,
        color: "text-green-400",
        items: [
          { name: "Support Tickets", href: '/admin/support', icon: MessageCircle },
          { name: "Support Hub", href: '/admin/support-hub', icon: Headphones },
        ]
      }
    ];

    // 2. Filter groups and items based on Global Feature Logic
    groups = groups.filter(g => g.visible !== false);
    groups = groups.map(g => ({
      ...g,
      items: g.items.filter((i: any) => i.visible !== false)
    }));

    // 3. Apply Dynamic Layout Logic (Order & Visibility Toggles)
    if (sidebarConfig) {
      const order = sidebarConfig.order as string[];
      const visibility = sidebarConfig.visibility as Record<string, boolean>;

      if (order && order.length > 0) {
        groups.sort((a, b) => {
          const idxA = order.indexOf(a.id);
          const idxB = order.indexOf(b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }

      if (visibility) {
        groups = groups.filter(g => visibility[g.id] !== false);
      }
    }

    return groups;
  }, [t, sidebarConfig, productsEnabled, servicesEnabled]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const SidebarContent = ({ collapsed }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-[#08101b] text-white overflow-hidden transition-all duration-300">
      <div className={cn("flex items-center gap-3 border-b border-white/5 h-20 shrink-0 transition-all", collapsed ? "justify-center px-0" : "px-6")}>
        <div className="w-10 h-10 bg-white rounded-xl shadow-lg border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
          {displayLogo ? <Image src={displayLogo} alt="Logo" fill className="object-contain p-1" unoptimized /> : <ShieldCheck size={20} className="text-primary" />}
        </div>
        {!collapsed && (
          <div className="animate-in fade-in duration-500 overflow-hidden whitespace-nowrap">
            <h1 className="font-black text-sm uppercase leading-none">{settings?.websiteName || 'Smart Clean'}</h1>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Admin Central</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          if (group.id === 'dashboard_link') {
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all text-white/40 hover:bg-white/5 hover:text-white",
                  collapsed ? "justify-center px-0 h-12" : "px-3 py-3",
                  pathname === group.href && "bg-white/10 text-white border border-white/5 shadow-xl"
                )}
              >
                <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3 flex-1")}>
                  <group.icon size={18} className={cn(group.color, pathname === group.href && "text-white")} />
                  {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest">{group.title}</span>}
                </div>
                {!collapsed && <ChevronRight size={14} className="opacity-40" />}
              </Link>
            );
          }

          const isGroupActive = group.items.some((item: any) => pathname === item.href);
          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                className={cn("flex items-center w-full rounded-xl transition-all text-white/40 hover:bg-white/5 hover:text-white", collapsed ? "justify-center px-0 h-10" : "px-3 py-2", isGroupActive && "bg-white/5 text-white")}
              >
                <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "flex-1 gap-3")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isGroupActive ? "bg-white/10" : "group-hover:bg-white/10")}>
                    <group.icon size={18} className={cn("shrink-0", group.color)} />
                  </div>
                  {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-left">{group.title}</span>}
                </div>
                {!collapsed && <ChevronRight size={14} className={cn("transition-transform duration-300 ml-auto", expandedGroups[group.id] ? "rotate-90" : "")} />}
              </button>

              {expandedGroups[group.id] && !collapsed && (
                <div className="mt-1 space-y-1 pl-11 animate-in slide-in-from-top-2 duration-300">
                  {group.items.map((item: any) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn("flex items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all relative group/item", pathname === item.href ? "bg-white text-[#081621] shadow-lg scale-[1.02]" : "text-white/50 hover:text-white")}
                    >
                      <item.icon size={14} className={cn("mr-3 transition-colors shrink-0", pathname === item.href ? "text-primary" : "opacity-40 group-hover/item:opacity-100")} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={cn("p-4 border-t border-white/5 shrink-0 transition-all", collapsed && "flex justify-center")}>
        <Button variant="ghost" onClick={() => setIsLogoutDialogOpen(true)} className={cn("justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12", collapsed ? "w-10 px-0 flex justify-center" : "w-full px-4")}>
          <LogOut size={18} className={cn("text-red-400 shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">Logout System</span>}
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || roleLoading || !mounted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Terminal...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside className={cn("hidden lg:flex flex-col h-full bg-[#08101b] transition-all duration-300 ease-in-out relative border-r border-white/5 shrink-0 z-50", isCollapsed ? "w-20" : "w-72")}>
        <SidebarContent collapsed={isCollapsed} />
        <button onClick={handleToggleCollapse} className="absolute -right-3.5 top-24 bg-primary text-white rounded-full h-7 w-7 shadow-xl z-[100] flex items-center justify-center hover:scale-110 border-2 border-[#F8FAFC]">
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ArrowLeft size={14} strokeWidth={3} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-gray-600"><Menu size={22} /></Button></SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#08101b] border-none w-72">
                <SheetHeader className="sr-only"><SheetTitle>Admin Navigation</SheetTitle><SheetDescription>Control System</SheetDescription></SheetHeader>
                <SidebarContent collapsed={false} />
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Command Center</span>
              <span className="text-xs font-bold text-gray-900 flex items-center gap-2">Live Status <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /></span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100 h-10">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-gray-900 leading-none">{user?.displayName || 'Admin'}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Authorized</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-md">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar">
          <div className="max-w-full lg:max-w-[1400px] mx-auto min-0">{children}</div>
        </main>
        <AdminBottomNav />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] max-w-[90vw] border-none shadow-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-red-600 flex items-center gap-2"><LogOut size={20} /> Logout System?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">Confirm session termination. You will be redirected to the login page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 flex gap-3">
            <AlertDialogCancel className="rounded-xl flex-1 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-black uppercase text-xs tracking-widest">Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
