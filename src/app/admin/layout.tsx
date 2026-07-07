
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Gift,
  Clock,
  DollarSign,
  Handshake,
  Compass,
  ListChecks,
  Settings2,
  FolderTree,
  Video
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/components/providers/language-provider';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

const STORAGE_KEY = 'admin_sidebar_collapsed';

// Global variable to persist scroll position across client-side navigations
let savedSidebarScrollTop = 0;

/**
 * 🛠️ SidebarContent Component
 */
const SidebarContent = React.memo(({ 
  collapsed, 
  closeMobile, 
  pathname, 
  NAV_GROUPS, 
  expandedGroups, 
  toggleGroup,
  scrollRef,
  displayLogo,
  settings,
  onLogout,
  t
}: any) => {
  return (
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

      <div 
        ref={scrollRef}
        onScroll={(e) => { savedSidebarScrollTop = e.currentTarget.scrollTop; }}
        className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar"
      >
        {NAV_GROUPS.map((group: any) => {
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
                  {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{t(`admin.${group.id}`)}</span>}
                </div>
              </Link>
            );
          }

          const isGroupActive = group.items.some((item: any) => pathname === item.href);
          const isExpanded = expandedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!collapsed) {
                    toggleGroup(group.id);
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
                  {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-left whitespace-nowrap">{t(`admin.${group.id}`)}</span>}
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
                      <span className="truncate whitespace-nowrap">{t(`admin.${item.key || item.name.toLowerCase().replace(/\s+/g, '_')}`)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={cn("p-4 border-t border-white/5 shrink-0 transition-all duration-300", collapsed && "flex justify-center")}>
        <Button variant="ghost" onClick={onLogout} className={cn("justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12 transition-all duration-300", collapsed ? "w-10 px-0 flex justify-center" : "w-full px-4")}>
          <LogOut size={18} className={cn("text-red-400 shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">{t('admin.logout')}</span>}
        </Button>
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const layoutConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(layoutConfigRef);

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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isUserLoading || roleLoading) return;
    if (user && !isAdmin) {
      toast({ variant: "destructive", title: "Access Denied", description: "Admin privileges required." });
      router.replace('/');
    }
  }, [user, isAdmin, isUserLoading, roleLoading, router, toast]);

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
          { name: "New Order", key: "new_order", href: '/admin/orders?create=true', icon: Plus, visible: productsEnabled },
          { name: "New Booking", key: "new_booking", href: '/admin/bookings?create=true', icon: Plus, visible: servicesEnabled },
          { name: "Sales Leads", key: "leads", href: '/admin/leads', icon: TrendingUp },
        ].filter(i => i.visible !== false)
      },
      {
        id: 'orders',
        title: "Order & Booking",
        icon: ShoppingCart,
        color: "text-blue-400",
        items: [
          { name: "Product Orders", key: "orders", href: '/admin/orders', icon: Package, visible: productsEnabled },
          { name: "Service Bookings", key: "bookings", href: '/admin/bookings', icon: Calendar, visible: servicesEnabled },
          { name: "Cleaning Projects", key: "projects", href: '/admin/projects', icon: Briefcase },
          { name: "Invoices", key: "invoices", href: '/admin/invoices', icon: ReceiptText },
          { name: "Logistics", key: "couriers", href: '/admin/couriers', icon: Truck, visible: productsEnabled },
        ].filter(i => i.visible !== false)
      },
      {
        id: 'inventory',
        title: "PRODUCT MENU",
        icon: Box,
        color: "text-amber-400",
        visible: productsEnabled,
        items: [
          { name: "All Products", key: "product_list", href: '/admin/products', icon: Package },
          { name: "Products Attribute", key: "attributes", href: '/admin/products/attributes', icon: Settings2 },
          { name: "Taxonomy (L1, L2, L3)", key: "taxonomy", href: '/admin/products/attributes?tab=taxonomy', icon: FolderTree },
          { name: "Brand Registry", key: "brands", href: '/admin/attributes/brands', icon: Award },
          { name: "Variant Rules", key: "variants", href: '/admin/attributes/variants', icon: Shapes },
          { name: "Stock Alerts", key: "stock_alerts", href: '/admin/inventory/alerts', icon: AlertCircle },
        ]
      },
      {
        id: 'services',
        title: "SERVICE MENU",
        icon: Wrench,
        color: "text-sky-400",
        visible: servicesEnabled,
        items: [
          { name: "Service List", key: "service_list", href: '/admin/services', icon: Wrench },
          { name: "Sub-Services (Add-ons)", key: "sub_services", href: '/admin/services/sub-services', icon: Layers },
          { name: "Service Attribute", key: "service_attributes", href: '/admin/services/attributes', icon: Settings2 },
          { name: "Custom Requests", key: "custom_requests", href: '/admin/services/custom-requests', icon: ClipboardList },
          { name: "Service Areas", key: "areas", href: '/admin/areas', icon: Globe },
          { name: "Billing & Plan", key: "subscription", href: '/admin/subscription', icon: Wallet },
        ]
      },
      {
        id: 'marketing',
        title: "MARKETING & PROMOTIONS",
        icon: Target,
        color: "text-pink-400",
        items: [
          { name: "Landing Pages", key: "landing_pages", href: '/admin/marketing/landing-pages', icon: Layout },
          { name: "Campaign Mgmt", key: "campaigns", href: '/admin/campaigns', icon: Megaphone },
          { name: "Affiliate System", key: "referrals", href: '/admin/referrals', icon: Award, visible: servicesEnabled },
        ].filter(i => i.visible !== false)
      },
      {
        id: 'offers',
        title: "OFFER & CAMPAIGN",
        icon: TicketPercent,
        color: "text-orange-400",
        items: [
          { name: "Advanced Offers", key: "advanced_offers", href: '/admin/offers/advanced', icon: Gift },
          { name: "Coupons", key: "coupons", href: '/admin/offers/coupons', icon: TicketPercent },
          { name: "Flash Sales", key: "flash_sales", href: '/admin/offers/flash-sales', icon: Zap },
          { name: "Smart Pricing", key: "smart_pricing", href: '/admin/offers/smart-pricing', icon: TrendingUp },
        ]
      },
      {
        id: 'hrm',
        title: "HRM",
        icon: HardHat,
        color: "text-yellow-400",
        items: [
          { name: "Staff Directory", key: "staff_directory", href: '/admin/employees', icon: Users },
          { name: "Attendance Logs", key: "attendance", href: '/admin/hrm/attendance', icon: Clock },
          { name: "Payroll & Models", key: "payroll", href: '/admin/hrm/payroll', icon: DollarSign },
          { name: "Leave Requests", key: "leaves", href: '/admin/hrm/leaves', icon: Calendar },
          { name: "Expense Claims", key: "expenses", href: '/admin/hrm/expenses', icon: Wallet },
          { name: "Access Control", key: "access_control", href: '/admin/roles', icon: ShieldCheck },
        ]
      },
      {
        id: 'finance',
        title: "FINANCIAL HUB",
        icon: Wallet,
        color: "text-green-400",
        items: [
          { name: "Finance Overview", key: "finance_overview", href: '/admin/finance', icon: TrendingUp },
          { name: "Master Ledger", key: "ledger", href: '/admin/finance/ledger', icon: FileText },
          { name: "Bank & Cash", key: "accounts", href: '/admin/finance/accounts', icon: Building2 },
          { name: "Staff Salaries", key: "staff_salaries", href: '/admin/finance/salaries', icon: DollarSign },
          { name: "Project Costing", key: "projects", href: '/admin/finance/projects', icon: Target },
        ]
      },
      {
        id: 'customize',
        title: "SITE CUSTOMIZE",
        icon: Palette,
        color: "text-fuchsia-400",
        items: [
          { name: "Homepage Builder", key: "homepage_builder", href: '/admin/customize/homepage-builder', icon: Navigation },
          { name: "Hero Banners", key: "hero_banners", href: '/admin/customize/hero', icon: Layout },
          { name: "Navigation Hub", key: "navigation_hub", href: '/admin/customize/navigation', icon: Compass },
          { name: "Team Members", key: "team", href: '/admin/customize/team', icon: Users },
          { name: "Header & Footer", key: "theme", href: '/admin/customize/theme', icon: Layers },
          { name: "Dynamic Pages", key: "pages", href: '/admin/pages', icon: FileText },
        ]
      },
      {
        id: 'system',
        title: "SETTINGS",
        icon: Settings,
        color: "text-slate-300",
        items: [
          { name: "Global Settings", key: "global_settings", href: '/admin/settings', icon: Settings },
          { name: "Payment Gateways", key: "payment_gateways", href: '/admin/payments', icon: Wallet },
          { name: "Delivery Fees", key: "delivery_fees", href: '/admin/settings/delivery', icon: Truck },
          { name: "Localization", key: "localization", href: '/admin/settings/languages', icon: Languages },
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

  // Handle auto-expansion of groups based on current path
  useEffect(() => {
    NAV_GROUPS.forEach(group => {
      const isGroupActive = group.items.some((item: any) => pathname === item.href);
      if (isGroupActive) {
        setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, NAV_GROUPS]);

  // Precise scroll restoration on pathname change
  useEffect(() => {
    if (sidebarScrollRef.current) {
      const restoreScroll = () => {
        if (sidebarScrollRef.current) {
          sidebarScrollRef.current.scrollTop = savedSidebarScrollTop;
        }
      };
      
      requestAnimationFrame(restoreScroll);
      const timer = setTimeout(restoreScroll, 50);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isUserLoading || roleLoading || !mounted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Loading Terminal...</p>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside className={cn("hidden lg:flex flex-col h-full bg-[#08101b] transition-all duration-500 ease-in-out relative border-r border-white/5 shrink-0 z-50", isCollapsed ? "w-20" : "w-72")}>
        <SidebarContent 
          collapsed={isCollapsed} 
          pathname={pathname}
          NAV_GROUPS={NAV_GROUPS}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          scrollRef={sidebarScrollRef}
          displayLogo={displayLogo}
          settings={settings}
          onLogout={() => setIsLogoutDialogOpen(true)}
          t={t}
        />
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
                <SidebarContent 
                  collapsed={false} 
                  closeMobile={() => setIsMobileMenuOpen(false)} 
                  pathname={pathname}
                  NAV_GROUPS={NAV_GROUPS}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  displayLogo={displayLogo}
                  settings={settings}
                  onLogout={() => setIsLogoutDialogOpen(true)}
                  t={t}
                />
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t('admin.command_center')}</span>
              <span className="text-xs font-bold text-gray-900 flex items-center gap-2">{t('admin.live_status')} <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /></span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* 🌐 LANGUAGE TOGGLE */}
            <div className="flex items-center gap-2 mr-2 border-r pr-4 border-gray-100 h-10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary/5 rounded-xl h-9"
              >
                <Globe size={14} className="text-primary" />
                <span className="hidden sm:inline">{language === 'bn' ? 'English' : 'বাংলা'}</span>
                <span className="sm:hidden">{language === 'bn' ? 'EN' : 'BN'}</span>
              </Button>
            </div>

            <div className="flex items-center gap-3 pl-0 h-10">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-gray-900 leading-none">{user?.displayName || 'Admin'}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{t('admin.profile')}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-md">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar min-w-0">
          <div className="max-w-full lg:max-w-[1400px] mx-auto min-w-0">{children}</div>
        </main>
        <AdminBottomNav />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] max-w-[90vw] border-none shadow-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-red-600 flex items-center gap-2"><LogOut size={20} /> {t('admin.logout')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">Confirm session termination. You will be redirected to the login page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 flex gap-3">
            <AlertDialogCancel className="rounded-xl flex-1 font-bold">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-black uppercase text-xs tracking-widest">{t('admin.logout')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
