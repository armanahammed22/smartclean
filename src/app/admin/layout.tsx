
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
  ShoppingCart,
  Truck,
  Package,
  Wrench,
  Tags,
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
  Headphones,
  Layout,
  Link as LinkIcon,
  MousePointer2,
  FileText,
  Plus,
  TicketPercent,
  Percent,
  Tag,
  Mail,
  Palette,
  ChevronDown
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
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

  // Exact fixed serial order requested
  const NAV_GROUPS = [
    {
      id: 'dashboard',
      title: "DASHBOARD",
      icon: LayoutDashboard,
      items: [
        { name: "Dashboard", href: '/admin/dashboard', icon: LayoutDashboard },
        { name: "Reports", href: '/admin/reports', icon: BarChart3 },
      ]
    },
    {
      id: 'orders',
      title: "ORDER & BOOKING",
      icon: ShoppingCart,
      items: [
        { name: "Product Orders", href: '/admin/orders', icon: ShoppingCart },
        { name: "Service Bookings", href: '/admin/bookings', icon: Calendar },
        { name: "Order Tracking", href: '/admin/couriers', icon: Truck },
      ]
    },
    {
      id: 'inventory',
      title: "INVENTORY",
      icon: Box,
      items: [
        { name: "Products", href: '/admin/products', icon: Box },
        { name: "Categories", href: '/admin/products/categories', icon: Tags },
      ]
    },
    {
      id: 'services',
      title: "SERVICES",
      icon: Wrench,
      items: [
        { name: "Service List", href: '/admin/services', icon: Wrench },
        { name: "Sub Services", href: '/admin/services/sub-services', icon: Grid },
        { name: "Service Areas", href: '/admin/areas', icon: MapPin },
      ]
    },
    {
      id: 'crm',
      title: "CRM & USERS",
      icon: Users,
      items: [
        { name: "Customers", href: '/admin/customers', icon: UserSquare2 },
        { name: "Staff", href: '/admin/employees', icon: Users },
        { name: "Access Control", href: '/admin/roles', icon: Lock },
      ]
    },
    {
      id: 'marketing',
      title: "OFFER & PROMOTION",
      icon: Tag,
      items: [
        { name: "Offers", href: '/admin/marketing', icon: Tag },
        { name: "Campaigns", href: '/admin/marketing', icon: Zap },
        { name: "Coupons", href: '/admin/marketing', icon: TicketPercent },
        { name: "Discounts", href: '/admin/marketing', icon: Percent },
        { name: "Referrals", href: '/admin/referrals', icon: Share2 },
      ]
    },
    {
      id: 'pages',
      title: "PAGE MANAGEMENT",
      icon: FileText,
      items: [
        { name: "All Site Pages", href: '/admin/pages', icon: FileText },
        { name: "Create New Page", href: '/admin/pages/new', icon: Plus },
      ]
    },
    {
      id: 'customize',
      title: "SITE CUSTOMIZE",
      icon: Palette,
      items: [
        { name: "Hero Banners", href: '/admin/customize/hero', icon: Layout },
        { name: "Quick Link", href: '/admin/customize/quick-links', icon: LinkIcon },
        { name: "Quick Action", href: '/admin/customize/quick-actions', icon: MousePointer2 },
        { name: "Homepage Sections", href: '/admin/customize/sections', icon: Grid },
        { name: "Header Settings", href: '/admin/settings', icon: Settings2 },
        { name: "Footer Settings", href: '/admin/settings', icon: FileText },
      ]
    },
    {
      id: 'system',
      title: "SYSTEM",
      icon: Settings,
      items: [
        { name: "Payments", href: '/admin/payments', icon: Wallet },
        { name: "Settings", href: '/admin/settings', icon: Settings },
      ]
    },
    {
      id: 'support',
      title: "SUPPORT",
      icon: Headphones,
      items: [
        { name: "Contact Info", href: '/admin/settings', icon: Mail },
        { name: "Social Link", href: '/admin/settings', icon: Globe },
        { name: "Support Hub", href: '/admin/support-hub', icon: Headphones },
      ]
    }
  ];

  // Auto-expand group based on active pathname
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find(group => 
      group.items.some(item => pathname === item.href)
    );
    if (activeGroup) {
      setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

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

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gradient-to-b from-[#081621] to-[#050d14]">
        {NAV_GROUPS.map((group) => {
          const isGroupExpanded = expandedGroups[group.id];
          const isGroupActive = group.items.some(item => pathname === item.href);
          
          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all text-left group",
                  isGroupActive ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={18} className={cn("shrink-0", isGroupActive ? "text-primary" : "text-white/40")} />
                  {!collapsed && <span className="text-[11px] font-black uppercase tracking-widest">{group.title}</span>}
                </div>
                {!collapsed && (
                  <div className="shrink-0 transition-transform duration-200">
                    {isGroupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </button>

              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out pl-4",
                isGroupExpanded && !collapsed ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
              )}>
                <div className="space-y-0.5 border-l border-white/5 pl-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg transition-all group relative h-9",
                        pathname === item.href 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon size={14} className={cn("shrink-0 mr-3", pathname === item.href ? "text-white" : "text-gray-500")} />
                      <span className="text-[11px] font-bold truncate tracking-tight">{item.name}</span>
                      {pathname === item.href && (
                        <div className="absolute right-2 w-1 h-1 rounded-full bg-white animate-pulse" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
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
          isCollapsed ? "w-16" : "w-64"
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
              <SheetContent side="left" className="p-0 bg-[#081621] border-none w-64 shadow-2xl">
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
