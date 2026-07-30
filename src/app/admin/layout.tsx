
'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  BarChart3,
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
  Video,
  FileCode,
  FileSpreadsheet,
  Printer,
  X,
  UserX,
  CreditCard,
  CheckCircle2,
  Calculator
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, query, orderBy } from 'firebase/firestore';
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
  sidebarConfig,
  appearance,
  onLogout,
  t,
  language
}: any) => {
  const sidebarStyles = {
    backgroundColor: appearance?.bgColor || '#08101b',
    color: appearance?.textColor || '#ffffff',
    borderRight: `1px solid ${appearance?.borderColor || 'rgba(255,255,255,0.05)'}`,
    width: collapsed ? (appearance?.collapsedWidth || '80px') : (appearance?.expandedWidth || '288px'),
  };

  const activeStyles = {
    backgroundColor: appearance?.activeBgColor || 'rgba(255,255,255,0.1)',
    color: appearance?.activeTextColor || '#ffffff',
  };

  const textStyle = {
    fontSize: appearance?.fontSize || '15px',
    fontWeight: appearance?.fontWeight || '600',
    fontFamily: appearance?.fontFamily || "'Hind Siliguri', sans-serif"
  };

  const hoverClass = appearance?.hoverBgColor ? "" : "hover:bg-white/5";

  return (
    <div 
      className="flex flex-col h-full overflow-hidden transition-all duration-300"
      style={{ backgroundColor: sidebarStyles.backgroundColor, color: sidebarStyles.color, borderRight: sidebarStyles.borderRight }}
    >
      <div className={cn("flex items-center gap-3 border-b border-white/5 h-20 shrink-0 transition-all duration-300", collapsed ? "justify-center px-0" : "px-6")}>
        <div className="w-10 h-10 bg-white rounded-xl shadow-lg border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
          {displayLogo ? <Image src={displayLogo} alt="Logo" fill className="object-contain p-1" unoptimized /> : <ShieldCheck size={20} className="text-primary" />}
        </div>
        {!collapsed && (
          <div className="animate-in fade-in duration-500 overflow-hidden whitespace-nowrap text-left">
            <h1 className="font-black text-sm uppercase leading-none">{settings?.websiteName || 'Smart Clean'}</h1>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Admin Central</p>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
        {NAV_GROUPS.map((group: any) => {
          const isDirectLink = group.items.length === 0 && group.href;
          if (isDirectLink) {
            const isActive = pathname === group.href;
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                scroll={false}
                onClick={closeMobile}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all duration-300",
                  collapsed ? "justify-center px-0 h-12" : "px-3 py-3",
                  isActive ? "shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/5" : `opacity-60 hover:opacity-100 ${hoverClass}`,
                )}
                style={isActive ? activeStyles : {}}
              >
                <div className={cn("flex items-center transition-all duration-300", collapsed ? "justify-center" : "gap-3 flex-1")}>
                  <group.icon size={collapsed ? 22 : 20} className={cn("transition-colors duration-300", !isActive && group.color, isActive && "text-white scale-110")} />
                  {!collapsed && <span className="uppercase tracking-tight whitespace-nowrap" style={textStyle}>{t(`admin.${group.id}`)}</span>}
                </div>
              </Link>
            );
          }

          const isGroupActive = group.items.some((item: any) => pathname === item.href);
          const isExpanded = expandedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={(e) => { e.preventDefault(); if (!collapsed) toggleGroup(group.id); }}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all duration-300", 
                  collapsed ? "justify-center px-0 h-10" : "px-3 py-2.5", 
                  isGroupActive && !collapsed ? "bg-white/5 opacity-100" : `opacity-60 hover:opacity-100 ${hoverClass}`
                )}
              >
                <div className={cn("flex items-center transition-all duration-300", collapsed ? "justify-center w-full" : "flex-1 gap-3")}>
                  <group.icon size={collapsed ? 22 : 20} className={cn("shrink-0 transition-colors duration-300", !isGroupActive && group.color)} />
                  {!collapsed && <span className="uppercase tracking-tight text-left whitespace-nowrap" style={textStyle}>{t(`admin.${group.id}`)}</span>}
                </div>
                {!collapsed && <ChevronRight size={14} className={cn("transition-transform duration-300 ml-auto opacity-40", isExpanded ? "rotate-90" : "")} />}
              </button>

              {isExpanded && !collapsed && (
                <div className="mt-1 space-y-1 pl-8 animate-in slide-in-from-top-2 duration-300 border-l border-white/5 ml-4">
                  {group.items.map((item: any) => {
                    const isItemActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        scroll={false}
                        onClick={closeMobile}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg transition-all relative group/item", 
                          isItemActive ? "bg-white text-[#081621] shadow-xl scale-[1.05] z-10" : "opacity-50 hover:opacity-100 hover:translate-x-1"
                        )}
                        style={isItemActive ? activeStyles : {}}
                      >
                        <item.icon size={16} className={cn("mr-3 transition-colors shrink-0", isItemActive ? "scale-110" : "opacity-40 group-hover/item:opacity-100")} />
                        <span className="truncate whitespace-nowrap text-left" style={{ ...textStyle, fontSize: `calc(${textStyle.fontSize} - 2px)` }}>{t(`admin.${item.key || item.name.toLowerCase().replace(/\s+/g, '_')}`)}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={cn("p-4 border-t border-white/5 shrink-0 transition-all duration-300", collapsed && "flex justify-center")}>
        <Button variant="ghost" onClick={onLogout} className={cn("justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12 transition-all duration-300", collapsed ? "w-10 px-0 flex justify-center" : "w-full px-4")}>
          <LogOut size={18} className={cn("text-red-400 shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span className="font-black text-[11px] uppercase tracking-widest">{t('admin.logout')}</span>}
        </Button>
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

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

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid)) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
    if (!isUserLoading && !roleLoading && user && !isAdmin) router.replace('/');
  }, [user, isAdmin, isUserLoading, roleLoading, router]);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const layoutConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(layoutConfigRef);
  const appearanceRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_appearance') : null, [db]);
  const { data: appearance } = useDoc(appearanceRef);

  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  const NAV_GROUPS = useMemo(() => {
    const pEnabled = settings?.productsEnabled !== false;
    const sEnabled = settings?.servicesEnabled !== false;

    const groups = [
      { id: 'dashboard_link', href: '/admin/dashboard', icon: LayoutDashboard, color: "text-indigo-400", items: [] },
      { id: 'sales', icon: Zap, color: "text-rose-400", items: [
        { name: "Orders", key: "orders", href: '/admin/orders', icon: ShoppingCart, hide: !pEnabled }, 
        { name: "Bookings", key: "bookings", href: '/admin/bookings', icon: Calendar, hide: !sEnabled }, 
        { name: "Invoices", key: "invoices", href: '/admin/invoices', icon: ReceiptText },
        { name: "Quotations", key: "quotations", href: '/admin/quotations', icon: FileSpreadsheet, hide: !sEnabled }, 
        { name: "Leads", key: "leads", href: '/admin/leads', icon: TrendingUp }
      ]},
      { id: 'inventory', icon: Box, color: "text-amber-400", hide: !pEnabled, items: [
        { name: "Product List", key: "product_list", href: '/admin/products', icon: Package }, 
        { name: "Attributes", key: "attributes", href: '/admin/products/attributes', icon: Tags },
        { name: "Brands", key: "brands", href: '/admin/attributes/brands', icon: Award },
        { name: "Variants", key: "variants", href: '/admin/attributes/variants', icon: Shapes },
        { name: "Stock Alerts", key: "stock_alerts", href: '/admin/inventory/alerts', icon: AlertCircle }
      ]},
      { id: 'services', icon: Wrench, color: "text-sky-400", hide: !sEnabled, items: [
        { name: "Service List", key: "service_list", href: '/admin/services', icon: Wrench }, 
        { name: "Sub-Services", key: "sub_services", href: '/admin/services/sub-services', icon: Layers },
        { name: "Attributes", key: "service_attributes", href: '/admin/services/attributes', icon: Settings2 },
        { name: "Custom Requests", key: "custom_requests", href: '/admin/services/custom-requests', icon: MessageCircle },
        { name: "Service Areas", key: "areas", href: '/admin/areas', icon: MapPin },
        { name: "Packages", key: "packages", href: '/admin/services/packages', icon: Box },
        { name: "Subscription", key: "subscription", href: '/admin/subscription', icon: CreditCard }
      ]},
      { id: 'marketing', icon: Megaphone, color: "text-orange-400", items: [
        { name: "Landing Pages", key: "landing_pages", href: '/admin/marketing/landing-pages', icon: Layout },
        { name: "Campaigns", key: "campaigns", href: '/admin/campaigns', icon: Zap },
        { name: "Referrals", key: "referrals", href: '/admin/referrals', icon: Users }
      ]},
      { id: 'offers', icon: Gift, color: "text-red-400", items: [
        { name: "Advanced Offers", key: "advanced_offers", href: '/admin/offers/advanced', icon: Sparkles },
        { name: "Coupons", key: "coupons", href: '/admin/offers/coupons', icon: TicketPercent },
        { name: "Flash Sales", key: "flash_sales", href: '/admin/offers/flash-sales', icon: Clock, hide: !pEnabled },
        { name: "Smart Pricing", key: "smart_pricing", href: '/admin/offers/smart-pricing', icon: TrendingUp }
      ]},
      { id: 'seo', icon: Search, color: "text-blue-400", items: [
        { name: "SEO Settings", key: "seo_settings", href: '/admin/marketing/seo', icon: Globe },
        { name: "Meta Verification", key: "meta_verification", href: '/admin/seo/meta-verification', icon: ShieldCheck },
        { name: "Verification Files", key: "verification_files", href: '/admin/seo/verification-files', icon: FileCode },
        { name: "Google Analytics", key: "analytics", href: '/admin/seo/analytics', icon: BarChart3 },
        { name: "Tag Manager", key: "tag_manager", href: '/admin/seo/tag-manager', icon: Code },
        { name: "Tracking Hub", key: "tracking_hub", href: '/admin/seo/tracking-hub', icon: Activity },
        { name: "Event Logs", key: "event_logs", href: '/admin/seo/logs', icon: History }
      ]},
      { id: 'hrm', icon: HardHat, color: "text-amber-500", items: [
        { name: "Staff Directory", key: "staff_directory", href: '/admin/employees', icon: Users },
        { name: "Attendance", key: "attendance", href: '/admin/hrm/attendance', icon: ClipboardList },
        { name: "Payroll", key: "payroll", href: '/admin/hrm/payroll', icon: Wallet },
        { name: "Leaves", key: "leaves", href: '/admin/hrm/leaves', icon: Calendar },
        { name: "Expenses", key: "expenses", href: '/admin/hrm/expenses', icon: DollarSign },
        { name: "Access Control", key: "access_control", href: '/admin/roles', icon: ShieldCheck }
      ]},
      { id: 'customer_hub', href: '/admin/customers', icon: Users, color: "text-purple-400", items: [] },
      { id: 'partners', icon: Handshake, color: "text-indigo-400", items: [
        { name: "Partner Registry", key: "partner_registry", href: '/admin/partners', icon: Building2 },
        { name: "Partner Projects", key: "partner_projects", href: '/admin/partners/projects', icon: Briefcase, hide: !sEnabled },
        { name: "Commission Ledger", key: "commission_ledger", href: '/admin/partners/commissions', icon: FileText }
      ]},
      { id: 'vendors', icon: Store, color: "text-pink-400", items: [
        { name: "Vendor Registry", key: "vendor_registry", href: '/admin/vendors', icon: Store },
        { name: "Product Approvals", key: "product_approvals", href: '/admin/products/approvals', icon: CheckCircle2, hide: !pEnabled },
        { name: "Service Approvals", key: "service_approvals", href: '/admin/services/approvals', icon: CheckCircle2, hide: !sEnabled },
        { name: "Vendor Commissions", key: "vendor_commissions", href: '/admin/vendors/commissions', icon: Wallet },
        { name: "Verification Queue", key: "verification_queue", href: '/admin/vendors/verifications', icon: ShieldCheck }
      ]},
      { id: 'finance', icon: Wallet, color: "text-green-400", items: [
        { name: "Finance Overview", key: "finance_overview", href: '/admin/finance', icon: TrendingUp },
        { name: "Master Ledger", key: "ledger", href: '/admin/finance/ledger', icon: FileText },
        { name: "Bank & Cash", key: "accounts", href: '/admin/finance/accounts', icon: Building2 },
        { name: "Staff Salaries", key: "staff_salaries", href: '/admin/finance/salaries', icon: Users },
        { name: "Project Costing", key: "projects", href: '/admin/finance/projects', icon: Calculator, hide: !sEnabled }
      ]},
      { id: 'reports', href: '/admin/reports', icon: BarChart3, color: "text-emerald-400", items: [] },
      { id: 'customize', icon: Palette, color: "text-fuchsia-400", items: [
        { name: "Home Builder", key: "homepage_builder", href: '/admin/customize/homepage-builder', icon: Navigation },
        { name: "Banners", key: "hero_banners", href: '/admin/customize/hero', icon: Layout },
        { name: "Navigation", key: "navigation_hub", href: '/admin/customize/navigation', icon: Compass },
        { name: "Team", key: "team", href: '/admin/customize/team', icon: Users },
        { name: "Theme", key: "theme", href: '/admin/customize/theme', icon: Palette },
        { name: "Pages", key: "pages", href: '/admin/pages', icon: FileCode }
      ]},
      { id: 'system', icon: Settings, color: "text-slate-300", items: [
        { name: "Global", key: "global_settings", href: '/admin/settings', icon: Settings },
        { name: "Sidebar", key: "sidebar_appearance", href: '/admin/settings/appearance/sidebar', icon: List },
        { name: "API & Webhooks", key: "api_settings", href: '/admin/settings/api', icon: Code },
        { name: "Payments", key: "payment_gateways", href: '/admin/payments', icon: Wallet },
        { name: "Delivery", key: "delivery_fees", href: '/admin/settings/delivery', icon: Truck, hide: !pEnabled },
        { name: "Localization", key: "localization", href: '/admin/settings/languages', icon: Globe },
        { name: "Documents", key: "documents", href: '/admin/settings/documents', icon: Printer }
      ]},
      { id: 'ai_agents', icon: Bot, color: "text-cyan-400", items: [
        { name: "AI Sales Desk", key: "ai_sales", href: '/admin/ai/sales', icon: Zap, hide: !pEnabled },
        { name: "AI Booking Assistant", key: "ai_booking", href: '/admin/ai/booking', icon: Clock, hide: !sEnabled }
      ]},
      { id: 'support', icon: Headphones, color: "text-rose-300", items: [
        { name: "Tickets", key: "tickets", href: '/admin/support', icon: MessageCircle },
        { name: "Hub Config", key: "support_config", href: '/admin/support-hub', icon: Zap }
      ]}
    ];

    // Final Filter based on hide property
    return groups
      .filter(g => !g.hide)
      .map(g => ({
        ...g,
        items: (g.items || []).filter((i: any) => !i.hide)
      }));
  }, [sidebarConfig, t, settings]);

  if (isUserLoading || roleLoading || !mounted) return <div className="h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside className="hidden lg:flex flex-col h-full bg-[#08101b] transition-all duration-500 relative border-r border-white/5 shrink-0 z-50" style={{ width: isCollapsed ? (appearance?.collapsedWidth || '80px') : (appearance?.expandedWidth || '288px') }}>
        <SidebarContent collapsed={isCollapsed} pathname={pathname} NAV_GROUPS={NAV_GROUPS} expandedGroups={expandedGroups} toggleGroup={(id:string)=>setExpandedGroups(p=>({...p,[id]:!p[id]}))} displayLogo={displayLogo} settings={settings} appearance={appearance} onLogout={()=>setIsLogoutDialogOpen(true)} t={t} />
        <button onClick={()=>setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 top-24 bg-primary text-white rounded-full h-7 w-7 shadow-xl z-[100] flex items-center justify-center hover:scale-110 border-2 border-[#F8FAFC]">
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ArrowLeft size={14} strokeWidth={3} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu size={22} /></Button></SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#08101b] border-none w-72">
                <SheetHeader className="sr-only"><SheetTitle>Admin Menu</SheetTitle></SheetHeader>
                <SidebarContent collapsed={false} closeMobile={()=>setIsMobileMenuOpen(false)} pathname={pathname} NAV_GROUPS={NAV_GROUPS} expandedGroups={expandedGroups} toggleGroup={(id:string)=>setExpandedGroups(p=>({...p,[id]:!p[id]}))} displayLogo={displayLogo} settings={settings} appearance={appearance} onLogout={()=>setIsLogoutDialogOpen(true)} t={t} />
              </SheetContent>
            </Sheet>
            <span className="text-xs font-bold text-gray-900 flex items-center gap-2">{t('admin.live_status')} <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="text-[10px] font-black gap-2 h-9">
              <Globe size={14} /> {language === 'bn' ? 'English' : 'বাংলা'}
            </Button>
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black">{user.email?.[0].toUpperCase()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar">
          <Suspense fallback={<Loader2 className="animate-spin text-primary mx-auto mt-20" />}><div className="max-w-full lg:max-w-[1400px] mx-auto">{children}</div></Suspense>
        </main>
        <AdminBottomNav />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{t('admin.logout')}?</AlertDialogTitle>
            <AlertDialogDescription>Confirm session termination.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async()=>{await signOut(auth!);router.push('/login');}} className="bg-red-600">{t('admin.logout')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
