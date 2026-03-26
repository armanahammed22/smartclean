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
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, query, where } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
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

  // Dynamic Badges
  const newOrdersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), where('status', '==', 'New')) : null, [db, isAuthorized]);
  const newVendorsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'vendor_profiles'), where('status', '==', 'Pending')) : null, [db, isAuthorized]);
  const pendingProductsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'products'), where('approvalStatus', '==', 'Pending')) : null, [db, isAuthorized]);

  const { data: newOrders } = useCollection(newOrdersQuery);
  const { data: newVendors } = useCollection(newVendorsQuery);
  const { data: pendingProducts } = useCollection(pendingProductsQuery);

  const NAV_GROUPS = useMemo(() => [
    {
      id: 'dashboard',
      title: "DASHBOARD",
      icon: LayoutDashboard,
      color: "text-blue-400",
      items: [
        { name: "Overview", href: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      id: 'orders',
      title: "ORDER & BOOKING",
      icon: ShoppingCart,
      color: "text-emerald-400",
      items: [
        { name: "Product Orders", href: '/admin/orders', icon: ShoppingCart, badge: newOrders?.length || 0 },
        { name: "Service Bookings", href: '/admin/bookings', icon: Calendar },
        { name: "Logistics (Couriers)", href: '/admin/couriers', icon: Truck },
      ]
    },
    {
      id: 'inventory',
      title: "INVENTORY",
      icon: Box,
      color: "text-amber-400",
      items: [
        { name: "All Products", href: '/admin/products', icon: Box },
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
      items: [
        { name: "Service List", href: '/admin/services', icon: Wrench },
        { name: "Sub-Services", href: '/admin/services/sub-services', icon: Layers },
        { name: "Service Areas", href: '/admin/areas', icon: Globe },
      ]
    },
    {
      id: 'marketing',
      title: "MARKETING",
      icon: Target,
      color: "text-rose-400",
      items: [
        { name: "Marketing Overview", href: '/admin/marketing/overview', icon: Target },
        { name: "Flash Sales", href: '/admin/marketing/flash-sales', icon: Zap },
        { name: "Landing Pages", href: '/admin/marketing/landing-pages', icon: FileSpreadsheet },
        { name: "Facebook CAPI", href: '/admin/marketing/capi', icon: ShieldCheck },
        { name: "Facebook Pixel", href: '/admin/marketing/pixel', icon: Code },
      ]
    },
    {
      id: 'offers',
      title: "OFFER & COUPONS",
      icon: TicketPercent,
      color: "text-pink-400",
      items: [
        { name: "Coupon Codes", href: '/admin/offers/coupons', icon: TicketPercent },
        { name: "Homepage Banners", href: '/admin/offers/homepage-banners', icon: Layout },
        { name: "Navbar Offers", href: '/admin/offers/navbar-banners', icon: Smartphone },
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
        { name: "Sales Leads", href: '/admin/leads', icon: Briefcase },
      ]
    },
    {
      id: 'vendor_hub',
      title: "VENDOR HUB",
      icon: Store,
      color: "text-orange-400",
      items: [
        { name: "Manage Vendors", href: '/admin/vendors', icon: Store, badge: newVendors?.length || 0 },
        { name: "Product Approvals", href: '/admin/products/approvals', icon: CheckCircle, badge: pendingProducts?.length || 0 },
      ]
    },
    {
      id: 'internal',
      title: "INTERNAL PORTALS",
      icon: Globe,
      color: "text-teal-400",
      items: [
        { name: "Admin Portal", href: '/admin/dashboard', icon: Globe },
        { name: "Staff Portal", href: '/staff/dashboard', icon: Wrench },
      ]
    },
    {
      id: 'reports',
      title: "BUSINESS REPORTS",
      icon: BarChart3,
      color: "text-indigo-400",
      items: [
        { name: "Financial Reports", href: '/admin/reports', icon: BarChart3 },
      ]
    },
    {
      id: 'customize',
      title: "SITE CUSTOMIZE",
      icon: Palette,
      color: "text-cyan-400",
      items: [
        { name: "Homepage Builder", href: '/admin/customize/homepage-builder', icon: MousePointer2 },
        { name: "Layout & Theme", href: '/admin/customize/theme', icon: Palette },
        { name: "Dynamic Pages", href: '/admin/pages', icon: FileText },
        { name: "Quick Actions", href: '/admin/customize/quick-actions', icon: Zap },
        { name: "Quick Links", href: '/admin/customize/quick-links', icon: LinkIcon },
      ]
    },
    {
      id: 'system',
      title: "SYSTEM",
      icon: Settings,
      color: "text-slate-400",
      items: [
        { name: "Global Settings", href: '/admin/settings', icon: Settings },
        { name: "Error Logs", href: '/admin/error-logs', icon: AlertCircle },
      ]
    },
    {
      id: 'support',
      title: "SUPPORT",
      icon: MessageCircle,
      color: "text-green-400",
      items: [
        { name: "Support Tickets", href: '/admin/support', icon: MessageCircle },
        { name: "Support Hub (Floating)", href: '/admin/support-hub', icon: Headphones },
      ]
    }
  ], [newOrders, newVendors, pendingProducts]);

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
            <h1 className="font-black text-sm uppercase leading-none">Smart Clean</h1>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Admin Central</p>
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
          <Button variant="ghost" onClick={() => setIsLogoutDialogOpen(true)} className="w-full justify-start text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl h-12">
            <LogOut size={18} className="mr-3" />
            {!collapsed && <span className="font-black text-[10px] uppercase tracking-widest">Logout System</span>}
          </Button>
          <AlertDialogContent className="rounded-[2rem] max-w-sm">
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
              <span className="text-[9px] font-black uppercase text-gray-400">Admin Control</span>
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
