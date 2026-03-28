
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
  Zap,
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
  ShieldAlert,
  Code,
  Calendar,
  FileSpreadsheet,
  Mail,
  Bell,
  Facebook,
  Search,
  Tag,
  CreditCard,
  Languages,
  Shield,
  Activity,
  History,
  Navigation,
  Grid,
  TrendingUp,
  ImageIcon,
  Bot,
  Sparkles,
  MapPin,
  ClipboardList
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, query, where } from 'firebase/firestore';
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

const BOOTSTRAP_ADMIN_UIDS = ['6YTKdslETkVXcftvhSY5x9sjOgT2', 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

const STORAGE_KEY = 'admin_sidebar_collapsed';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ dashboard: true, sales: true, offers: true });
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  const sidebarConfigRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_sidebar') : null, [db]);
  const { data: sidebarConfig } = useDoc(sidebarConfigRef);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(STORAGE_KEY, String(newState));
  };

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);

  const isAuthorized = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid)) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  const newOrdersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const newVendorsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'vendor_profiles'), where('status', '==', 'Pending')) : null, [db, isAuthorized]);
  const pendingProductsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'products'), where('approvalStatus', '==', 'Pending')) : null, [db, isAuthorized]);

  const { data: newOrders } = useCollection(newOrdersQuery);
  const { data: newVendors } = useCollection(newVendorsQuery);
  const { data: pendingProducts } = useCollection(pendingProductsQuery);

  const NAV_GROUPS = useMemo(() => {
    const baseGroups: Record<string, any> = {
      dashboard: {
        id: 'dashboard',
        title: "DASHBOARD",
        icon: LayoutDashboard,
        color: "text-indigo-400",
        items: [
          { name: "Overview", href: '/admin/dashboard', icon: LayoutDashboard },
        ]
      },
      sales: {
        id: 'sales',
        title: "SALES TERMINAL",
        icon: ShoppingCart,
        color: "text-rose-400",
        items: [
          ...(productsEnabled ? [{ name: "New Order", href: '/admin/orders?create=true', icon: Plus }] : []),
          ...(servicesEnabled ? [{ name: "New Booking", href: '/admin/bookings?create=true', icon: Plus }] : []),
        ].filter(Boolean)
      },
      ai_agents: {
        id: 'ai_agents',
        title: "AI AGENTS (STAFF)",
        icon: Bot,
        color: "text-blue-400",
        items: [
          ...(productsEnabled || servicesEnabled ? [{ name: "AI Sales Desk", href: '/admin/ai/sales', icon: Sparkles }] : []),
          ...(servicesEnabled ? [{ name: "AI Booking Assistant", href: '/admin/ai/booking', icon: Sparkles }] : []),
        ].filter(Boolean)
      },
      orders: {
        id: 'orders',
        title: "ORDER & BOOKING",
        icon: ShoppingCart,
        color: "text-emerald-400",
        items: [
          ...(productsEnabled ? [{ name: "Product Orders", href: '/admin/orders', icon: ShoppingCart, badge: newOrders?.length || 0 }] : []),
          ...(servicesEnabled ? [{ name: "Service Bookings", href: '/admin/bookings', icon: Calendar }] : []),
          { name: "Invoices", href: '/admin/invoices', icon: FileText },
          ...(productsEnabled ? [{ name: "Logistics (Couriers)", href: '/admin/couriers', icon: Truck }] : []),
        ].filter(Boolean)
      },
      inventory: {
        id: 'inventory',
        title: "INVENTORY",
        icon: Box,
        color: "text-amber-400",
        visible: productsEnabled,
        items: [
          { name: "All Products", href: '/admin/products', icon: Box },
          { name: "Stock Alerts", href: '/admin/inventory/alerts', icon: AlertCircle },
          { name: "Categories", href: '/admin/products/categories', icon: Tags },
          { name: "Brands", href: '/admin/attributes/brands', icon: Award },
          { name: "Variants", href: '/admin/attributes/variants', icon: Shapes },
        ]
      },
      services: {
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
          { name: "Billing & Plan", href: '/admin/subscription', icon: CreditCard },
        ]
      },
      marketing: {
        id: 'marketing',
        title: "MARKETING & PROMOTIONS",
        icon: Target,
        color: "text-rose-400",
        items: [
          { name: "Intel Overview", href: '/admin/marketing/overview', icon: Activity },
          { name: "Landing Pages", href: '/admin/marketing/landing-pages', icon: Layout },
          { name: "Campaign Mgmt", href: '/admin/campaigns', icon: Megaphone },
          { name: "Tracking Hub", href: '/admin/marketing/settings', icon: Code },
          ...(servicesEnabled ? [{ name: "Affiliate System", href: '/admin/marketing/affiliate', icon: Award }] : []),
          { name: "SEO Settings", href: '/admin/marketing/seo', icon: Search },
        ].filter(Boolean)
      },
      offers: {
        id: 'offers',
        title: "OFFER & CAMPAIGN",
        icon: TicketPercent,
        color: "text-pink-400",
        items: [
          { name: "General & Analytics", href: '/admin/offers/analytics', icon: Activity },
          { name: "Flash Sale", href: '/admin/offers/flash-sales', icon: Zap },
          { name: "Coupons & Promo", href: '/admin/offers/coupons', icon: TicketPercent },
          { name: "Smart Pricing", href: '/admin/offers/smart-pricing', icon: TrendingUp },
          { name: "Usage Tracking", href: '/admin/offers/tracking', icon: History },
        ].filter(Boolean)
      },
      crm: {
        id: 'crm',
        title: "CRM & USERS",
        icon: Users,
        color: "text-purple-400",
        items: [
          { name: "Customer Directory", href: '/admin/customers', icon: Users },
          ...(servicesEnabled ? [{ name: "Staff Directory", href: '/admin/employees', icon: HardHat }] : []),
          { name: "Access Control", href: '/admin/roles', icon: ShieldCheck },
          { name: "Sales Leads", href: '/admin/leads', icon: Briefcase },
        ].filter(Boolean)
      },
      vendor_hub: {
        id: 'vendor_hub',
        title: "VENDOR HUB",
        icon: Store,
        color: "text-orange-400",
        visible: productsEnabled,
        items: [
          { name: "Manage Vendors", href: '/admin/vendors', icon: Store, badge: newVendors?.length || 0 },
          { name: "Product Approvals", href: '/admin/products/approvals', icon: CheckCircle, badge: pendingProducts?.length || 0 },
        ]
      },
      reports: {
        id: 'reports',
        title: "BUSINESS REPORTS",
        icon: BarChart3,
        color: "text-blue-400",
        items: [
          { name: "Financial Reports", href: '/admin/reports', icon: BarChart3 },
          { name: "Marketing Analytics", href: '/admin/marketing/analytics', icon: TrendingUp },
        ]
      },
      customize: {
        id: 'customize',
        title: "SITE CUSTOMIZE",
        icon: Palette,
        color: "text-cyan-400",
        items: [
          { name: "Homepage Builder", href: '/admin/customize/homepage-builder', icon: MousePointer2 },
          { name: "Hero Banners", href: '/admin/customize/hero', icon: Layout },
          { name: "Section Banners", href: '/admin/offers/homepage-banners', icon: ImageIcon },
          { name: "Bottom Navbar Image", href: '/admin/offers/navbar-banners', icon: ImageIcon },
          { name: "Top Nav Links", href: '/admin/customize/top-categories', icon: Navigation },
          { name: "Icon Grid", href: '/admin/customize/quick-links', icon: Grid },
          { name: "Feature Cards", href: '/admin/customize/quick-actions', icon: MousePointer2 },
          { name: "Header & Footer", href: '/admin/customize/theme', icon: Layers },
          { name: "Dynamic Pages", href: '/admin/pages', icon: FileText },
        ]
      },
      system: {
        id: 'system',
        title: "SYSTEM",
        icon: Settings,
        color: "text-slate-400",
        items: [
          { name: "General Settings", href: '/admin/settings', icon: Settings },
          ...(productsEnabled ? [{ name: "Delivery Fees", href: '/admin/settings/delivery', icon: Truck }] : []),
          { name: "Localization", href: '/admin/settings/languages', icon: Languages },
          { name: "Payment Gateways", href: '/admin/payments', icon: CreditCard },
          { name: "Fleet Tracking", href: '/admin/settings/tracking', icon: MapPin },
          { name: "API & Webhooks", href: '/admin/settings/api', icon: Code },
          { name: "System Logs", href: '/admin/error-logs', icon: AlertCircle },
        ].filter(Boolean)
      },
      support: {
        id: 'support',
        title: "SUPPORT",
        icon: MessageCircle,
        color: "text-green-400",
        items: [
          { name: "Support Tickets", href: '/admin/support', icon: MessageCircle },
          { name: "Support Hub", href: '/admin/support-hub', icon: Headphones },
        ]
      }
    };

    // Apply custom order if exists
    let orderedKeys = Object.keys(baseGroups);
    if (sidebarConfig?.order) {
      const savedOrder = sidebarConfig.order as string[];
      const validSaved = savedOrder.filter(k => baseGroups[k]);
      const missing = orderedKeys.filter(k => !validSaved.includes(k));
      orderedKeys = [...validSaved, ...missing];
    }

    return orderedKeys
      .map(key => baseGroups[key])
      .filter(g => g && g.visible !== false && g.items.length > 0);
  }, [newOrders, newVendors, pendingProducts, productsEnabled, servicesEnabled, sidebarConfig]);

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
    <div className="flex flex-col h-full bg-[#08101b] text-white overflow-hidden transition-all duration-300">
      <div className={cn(
        "flex items-center gap-3 border-b border-white/5 h-20 shrink-0 transition-all",
        collapsed ? "justify-center px-0" : "px-6"
      )}>
        <div className="w-10 h-10 bg-white rounded-xl shadow-lg border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
          {displayLogo ? (
            <Image src={displayLogo} alt="Logo" fill className="object-contain p-1" unoptimized />
          ) : (
            <ShieldCheck size={20} className="text-primary" />
          )}
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
          const isGroupActive = group.items.some(item => pathname === item.href);
          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all text-white/40 hover:bg-white/5 hover:text-white group",
                  collapsed ? "justify-center px-0 h-10" : "px-3 py-2",
                  isGroupActive && "bg-white/5 text-white"
                )}
              >
                <div className={cn(
                  "flex items-center",
                  collapsed ? "justify-center w-full" : "flex-1 gap-3"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg transition-all shrink-0 flex items-center justify-center",
                    isGroupActive ? "bg-white/10" : "group-hover:bg-white/10"
                  )}>
                    <group.icon size={18} className={cn("shrink-0", group.color)} />
                  </div>
                  {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-left animate-in fade-in slide-in-from-left-2">{group.title}</span>}
                </div>
                {!collapsed && <ChevronRight size={14} className={cn("transition-transform duration-300 ml-auto", expandedGroups[group.id] ? "rotate-90" : "")} />}
              </button>

              {expandedGroups[group.id] && !collapsed && (
                <div className="mt-1 space-y-1 pl-11 animate-in slide-in-from-top-2 duration-300">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all relative group/item",
                        pathname === item.href ? "bg-white text-[#081621] shadow-lg scale-[1.02]" : "text-white/50 hover:text-white"
                      )}
                    >
                      <item.icon size={14} className={cn("mr-3 transition-colors shrink-0", pathname === item.href ? "text-primary" : "opacity-40 group-hover/item:opacity-100")} />
                      <span className="truncate">{item.name}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute right-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">{item.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={cn("p-4 border-t border-white/5 shrink-0 transition-all", collapsed && "flex justify-center")}>
        <Button 
          variant="ghost" 
          onClick={() => setIsLogoutDialogOpen(true)} 
          className={cn(
            "justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12 transition-all",
            collapsed ? "w-10 px-0 flex justify-center" : "w-full px-4"
          )}
        >
          <LogOut size={18} className={cn("text-red-400 shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Logout System</span>}
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || roleLoading || !mounted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verifying Admin Terminal...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside className={cn(
        "hidden lg:flex flex-col h-full bg-[#08101b] transition-all duration-300 ease-in-out relative border-r border-white/5 shrink-0 z-50",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <SidebarContent collapsed={isCollapsed} />
        
        <button 
          onClick={handleToggleCollapse}
          className="absolute -right-3.5 top-24 bg-primary text-white rounded-full h-7 w-7 shadow-xl z-[100] flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-2 border-[#F8FAFC]"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-gray-600"><Menu size={22} /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#08101b] border-none w-72">
                <SheetHeader className="p-6 border-b border-white/5 sr-only">
                  <SheetTitle>Admin Navigation</SheetTitle>
                  <SheetDescription>Smart Clean Central Control</SheetDescription>
                </SheetHeader>
                <SidebarContent collapsed={false} />
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Management Terminal</span>
              <span className="text-xs font-bold text-gray-900 flex items-center gap-2">
                Server Status: Online <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 h-full">
            <Button variant="ghost" className="text-gray-600 gap-2 h-10 px-3 rounded-xl font-bold hover:bg-gray-50" asChild>
              <Link href="/">
                <Globe size={18} className="text-primary" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Live Site</span>
              </Link>
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100 h-10">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase text-gray-900 leading-none">{user?.displayName || 'Administrator'}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-60 mt-1">System Root</p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border-2 border-primary/10 shadow-md relative">
                {displayLogo ? (
                  <Image src={displayLogo} alt="Admin" fill className="object-contain p-1" unoptimized />
                ) : (
                  <span className="font-black text-primary">{user?.email?.[0].toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#F9FAFB] pb-24 lg:pb-10 custom-scrollbar">
          <div className="max-w-full lg:max-w-[1400px] mx-auto min-w-0">
            {children}
          </div>
        </main>

        <AdminBottomNav />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] max-sm border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-red-600 flex items-center gap-2">
              <LogOut size={20} /> Logout Admin?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              Confirm session termination. You will be redirected to the login page.
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
  );
}
