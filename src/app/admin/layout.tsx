
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
  Search,
  BarChart,
  Wallet,
  Building2,
  UserCheck,
  ReceiptText,
  Package,
  CircleEllipsis,
  Gift
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
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

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92', 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

const STORAGE_KEY = 'admin_sidebar_collapsed';

const DEFAULT_MENU_KEYS = [
  'dashboard_link', 
  'sales', 
  'orders', 
  'inventory',
  'services', 
  'marketing', 
  'offers',
  'seo',
  'hrm',
  'customer_hub',
  'partners',
  'vendors',
  'finance',
  'reports',
  'customize', 
  'system',
  'ai_agents',
  'support'
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 
    sales: true, 
    orders: true, 
    hrm: true,
    finance: true,
    inventory: true,
    services: true,
    customize: true,
    offers: true
  });
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const sidebarConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(sidebarConfigRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState !== null) setIsCollapsed(savedState === 'true');
      else setIsCollapsed(true); 
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
  const isAdmin = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid)) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const NAV_GROUPS = useMemo(() => {
    let groups = [
      {
        id: 'dashboard_link',
        title: "Dashboard",
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        color: "text-indigo-400",
        items: []
      },
      {
        id: 'sales',
        title: "Sales Terminal",
        icon: Zap,
        color: "text-rose-400",
        items: [
          { name: "New Order", href: '/admin/orders?create=true', icon: Plus, visible: productsEnabled },
          { name: "New Booking", href: '/admin/bookings?create=true', icon: Plus, visible: servicesEnabled },
          { name: "Sales Leads", href: '/admin/leads', icon: TrendingUp },
        ].filter(i => i.visible !== false)
      },
      {
        id: 'orders',
        title: "Order & Booking",
        icon: ShoppingCart,
        color: "text-blue-400",
        items: [
          { name: "Product Orders", href: '/admin/orders', icon: Package, visible: productsEnabled },
          { name: "Service Bookings", href: '/admin/bookings', icon: Calendar, visible: servicesEnabled },
          { name: "Invoices", href: '/admin/invoices', icon: ReceiptText },
          { name: "Logistics", href: '/admin/couriers', icon: Truck, visible: productsEnabled },
        ].filter(i => i.visible !== false)
      },
      {
        id: 'inventory',
        title: "Inventory",
        icon: Box,
        color: "text-amber-400",
        visible: productsEnabled,
        items: [
          { name: "All Products", href: '/admin/products', icon: Package },
          { name: "Stock Alerts", href: '/admin/inventory/alerts', icon: AlertCircle },
          { name: "Categories", href: '/admin/products/categories', icon: Tags },
          { name: "Brands", href: '/admin/attributes/brands', icon: Award },
          { name: "Variants", href: '/admin/attributes/variants', icon: Shapes },
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
          { name: "Sub-Services", href: '/admin/services/sub-services', icon: Layers },
          { name: "Custom Requests", href: '/admin/services/custom-requests', icon: ClipboardList },
          { name: "Service Areas", href: '/admin/areas', icon: Globe },
          { name: "Billing & Plan", href: '/admin/subscription', icon: Wallet },
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
        ].filter(i => i.visible !== false)
      },
      {
        id: 'offers',
        title: "OFFER & CAMPAIGN",
        icon: TicketPercent,
        color: "text-orange-400",
        items: [
          { name: "Advanced Offers", href: '/admin/offers/advanced', icon: Gift },
          { name: "Coupons", href: '/admin/offers/coupons', icon: TicketPercent },
          { name: "Flash Sales", href: '/admin/offers/flash-sales', icon: Zap },
          { name: "Smart Pricing", href: '/admin/offers/smart-pricing', icon: TrendingUp },
        ]
      },
      {
        id: 'seo',
        title: "SEO & TRACKING",
        icon: Globe,
        color: "text-emerald-400",
        items: [
          { name: "SEO Settings", href: '/admin/seo/settings', icon: Globe },
          { name: "Google Analytics", href: '/admin/seo/analytics', icon: BarChart },
          { name: "Facebook Pixel", href: '/admin/seo/pixel', icon: Code },
          { name: "Conversion API", href: '/admin/seo/capi', icon: ShieldCheck },
          { name: "Tracking Logs", href: '/admin/seo/logs', icon: History },
          { name: "Search Console", href: '/admin/seo/search-console', icon: Search },
          { name: "Tag Manager", href: '/admin/seo/tag-manager', icon: Code },
        ]
      },
      {
        id: 'hrm',
        title: "HRM",
        icon: HardHat,
        color: "text-yellow-400",
        items: [
          { name: "Staff Directory", href: '/admin/employees', icon: Users },
          { name: "Attendance Logs", href: '/admin/hrm/attendance', icon: Clock },
          { name: "Payroll & Models", href: '/admin/hrm/payroll', icon: DollarSign },
          { name: "Leave Requests", href: '/admin/hrm/leaves', icon: Calendar },
          { name: "Expense Claims", href: '/admin/hrm/expenses', icon: Wallet },
          { name: "Access Control", href: '/admin/roles', icon: ShieldCheck },
        ]
      },
      {
        id: 'customer_hub',
        title: "Customer Hub",
        icon: Users,
        color: "text-cyan-400",
        items: [
          { name: "Customer Directory", href: '/admin/customers', icon: UserCheck },
        ]
      },
      {
        id: 'partners',
        title: "B2B PARTNERS",
        icon: Handshake,
        color: "text-violet-400",
        items: [
          { name: "Partner Registry", href: '/admin/partners', icon: Building2 },
          { name: "Partner Projects", href: '/admin/partners/projects', icon: Briefcase },
          { name: "Commission Ledger", href: '/admin/partners/commissions', icon: Wallet },
        ]
      },
      {
        id: 'vendors',
        title: "VENDOR HUB",
        icon: Store,
        color: "text-teal-400",
        items: [
          { name: "All Vendors", href: '/admin/vendors', icon: Store },
          { name: "Pending Approvals", href: '/admin/vendors/verifications', icon: AlertCircle },
          { name: "Vendor Commissions", href: '/admin/vendors/commissions', icon: Wallet },
        ]
      },
      {
        id: 'finance',
        title: "FINANCIAL HUB",
        icon: Wallet,
        color: "text-green-400",
        items: [
          { name: "Finance Overview", href: '/admin/finance', icon: TrendingUp },
          { name: "Master Ledger", href: '/admin/finance/ledger', icon: FileText },
          { name: "Bank & Cash", href: '/admin/finance/accounts', icon: Building2 },
          { name: "Staff Salaries", href: '/admin/finance/salaries', icon: DollarSign },
          { name: "Project Costing", href: '/admin/finance/projects', icon: Target },
        ]
      },
      {
        id: 'reports',
        title: "BUSINESS REPORT",
        icon: BarChart3,
        color: "text-purple-400",
        items: [
          { name: "Financial Report", href: '/admin/reports', icon: FileText },
          { name: "HRM Analytics", href: '/admin/hrm/payroll', icon: Activity },
          { name: "Marketing Analytics", href: '/admin/marketing/analytics', icon: TrendingUp },
          { name: "Offers Analytics", href: '/admin/offers/analytics', icon: Activity },
        ]
      },
      {
        id: 'customize',
        title: "SITE CUSTOMIZE",
        icon: Palette,
        color: "text-fuchsia-400",
        items: [
          { name: "Homepage Builder", href: '/admin/customize/homepage-builder', icon: Navigation },
          { name: "Hero Banners", href: '/admin/customize/hero', icon: Layout },
          { name: "Section Banners", href: '/admin/offers/homepage-banners', icon: ImageIcon },
          { name: "Bottom Navbar", href: '/admin/customize/bottom-nav', icon: CircleEllipsis },
          { name: "Top Nav Links", href: '/admin/customize/top-categories', icon: Navigation },
          { name: "Icon Grid", href: '/admin/customize/quick-links', icon: Grid },
          { name: "Feature Cards", href: '/admin/customize/quick-actions', icon: Navigation },
          { name: "Header & Footer", href: '/admin/customize/theme', icon: Layers },
          { name: "Dynamic Pages", href: '/admin/pages', icon: FileText },
        ]
      },
      {
        id: 'system',
        title: "SETTINGS",
        icon: Settings,
        color: "text-slate-300",
        items: [
          { name: "Global Settings", href: '/admin/settings', icon: Settings },
          { name: "Payment Gateways", href: '/admin/payments', icon: Wallet },
          { name: "Delivery Fees", href: '/admin/settings/delivery', icon: Truck },
          { name: "Localization", href: '/admin/settings/languages', icon: Languages },
          { name: "API & Webhooks", href: '/admin/settings/api', icon: Code },
        ]
      },
      {
        id: 'ai_agents',
        title: "AI AGENTS (STAFF)",
        icon: Bot,
        color: "text-blue-300",
        items: [
          { name: "AI Sales Desk", href: '/admin/ai/sales', icon: Sparkles },
          { name: "AI Booking Assistant", href: '/admin/ai/booking', icon: Zap },
        ]
      },
      {
        id: 'support',
        title: "SUPPORT",
        icon: Headphones,
        color: "text-rose-300",
        items: [
          { name: "Support Tickets", href: '/admin/support', icon: MessageCircle },
          { name: "Support Hub Config", href: '/admin/support-hub', icon: Headphones },
        ]
      }
    ];

    const sidebarOrder = sidebarConfig?.order || DEFAULT_MENU_KEYS;
    const visibility = sidebarConfig?.visibility || {};

    return groups
      .filter(g => {
        if (g.visible === false) return false;
        if (visibility[g.id] === false) return false;
        return g.items.length > 0 || g.href;
      })
      .sort((a, b) => {
        const indexA = sidebarOrder.indexOf(a.id);
        const indexB = sidebarOrder.indexOf(b.id);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
  }, [productsEnabled, servicesEnabled, sidebarConfig]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const SidebarContent = ({ collapsed, closeMobile }: { collapsed?: boolean, closeMobile?: () => void }) => (
    <div className="flex flex-col h-full bg-[#08101b] text-white overflow-hidden transition-all duration-300">
      <div className={cn("flex items-center gap-3 border-b border-white/5 h-20 shrink-0 transition-all duration-300", collapsed ? "justify-center px-0" : "px-6")}>
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
          const isDirectLink = group.items.length === 0 && group.href;
          if (isDirectLink) {
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                scroll={false}
                onClick={closeMobile}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all duration-300 text-white/40 hover:bg-white/5 hover:text-white",
                  collapsed ? "justify-center px-0 h-12" : "px-3 py-3",
                  pathname === group.href && "bg-white/10 text-white border border-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                )}
              >
                <div className={cn("flex items-center transition-all duration-300", collapsed ? "justify-center" : "gap-3 flex-1")}>
                  <group.icon size={collapsed ? 22 : 18} className={cn("transition-colors duration-300", group.color, pathname === group.href && "text-white scale-110")} />
                  {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{group.title}</span>}
                </div>
              </Link>
            );
          }

          const isGroupActive = group.items.some((item: any) => pathname === item.href);
          const isExpanded = expandedGroups[group.id] || (isGroupActive && mounted);

          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!collapsed) {
                    setExpandedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }));
                  }
                }}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all duration-300 text-white/40 hover:bg-white/5 hover:text-white", 
                  collapsed ? "justify-center px-0 h-10" : "px-3 py-2.5", 
                  isGroupActive && !collapsed && "bg-white/5 text-white"
                )}
              >
                <div className={cn("flex items-center transition-all duration-300", collapsed ? "justify-center w-full" : "flex-1 gap-3")}>
                  <group.icon size={collapsed ? 22 : 18} className={cn("shrink-0 transition-colors duration-300", group.color)} />
                  {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-left whitespace-nowrap">{group.title}</span>}
                </div>
                {!collapsed && <ChevronRight size={14} className={cn("transition-transform duration-300 ml-auto opacity-40", isExpanded ? "rotate-90" : "")} />}
              </button>

              {isExpanded && !collapsed && (
                <div className="mt-1 space-y-1 pl-8 animate-in slide-in-from-top-2 duration-300">
                  {group.items.map((item: any) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      scroll={false}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all relative group/item", 
                        pathname === item.href 
                          ? "bg-white text-[#081621] shadow-xl scale-[1.05] z-10" 
                          : "text-white/50 hover:text-white hover:translate-x-1"
                      )}
                    >
                      <item.icon size={14} className={cn("mr-3 transition-colors shrink-0", pathname === item.href ? "text-primary scale-110" : "opacity-40 group-hover/item:opacity-100")} />
                      <span className="truncate whitespace-nowrap">{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={cn("p-4 border-t border-white/5 shrink-0 transition-all duration-300", collapsed && "flex justify-center")}>
        <Button variant="ghost" onClick={() => setIsLogoutDialogOpen(true)} className={cn("justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12 transition-all duration-300", collapsed ? "w-10 px-0 flex justify-center" : "w-full px-4")}>
          <LogOut size={18} className={cn("text-red-400 shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">Logout</span>}
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
      <aside className={cn("hidden lg:flex flex-col h-full bg-[#08101b] transition-all duration-500 ease-in-out relative border-r border-white/5 shrink-0 z-50", isCollapsed ? "w-20" : "w-72")}>
        <SidebarContent collapsed={isCollapsed} />
        <button 
          onClick={handleToggleCollapse} 
          className="absolute -right-3.5 top-24 bg-primary text-white rounded-full h-7 w-7 shadow-xl z-[100] flex items-center justify-center hover:scale-110 border-2 border-[#F8FAFC] transition-all duration-300 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ArrowLeft size={14} strokeWidth={3} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-gray-600">
                  <Menu size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#08101b] border-none w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation</SheetTitle>
                  <SheetDescription>Control System</SheetDescription>
                </SheetHeader>
                <SidebarContent collapsed={false} closeMobile={() => setIsMobileMenuOpen(false)} />
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

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar min-w-0">
          <div className="max-w-full lg:max-w-[1400px] mx-auto min-w-0">{children}</div>
        </main>
        <AdminBottomNav />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] max-w-[90vw] border-none shadow-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-red-600 flex items-center gap-2"><LogOut size={20} /> Logout Admin?</AlertDialogTitle>
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
