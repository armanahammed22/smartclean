
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
    <div className="flex flex-col h-full bg-[#0f172a] text-white">
      <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0">
        <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed && "justify-center w-full")}>
          <div className="p-2.5 bg-gradient-to-br from-green-500 to-lime-400 rounded-xl text-white shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-black tracking-tighter text-sm text-white">ADMIN CENTER</h1>
              <p className="text-[9px] text-green-400 font-black uppercase tracking-widest leading-none mt-0.5">Management Pro</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          const isGroupExpanded = expandedGroups[group.id];
          const isGroupActive = group.items.some(item => pathname === item.href);
          
          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 text-left group hover:scale-[1.02]",
                  isGroupActive ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={18} className={cn("shrink-0 transition-colors", isGroupActive ? "text-green-400" : "text-white/20 group-hover:text-white/60")} />
                  {!collapsed && <span className="text-[11px] font-black uppercase tracking-[0.15em]">{group.title}</span>}
                </div>
                {!collapsed && (
                  <div className={cn("shrink-0 transition-transform duration-300", isGroupExpanded ? "rotate-180" : "rotate-0")}>
                    <ChevronDown size={14} className="opacity-40" />
                  </div>
                )}
              </button>

              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out pl-4",
                isGroupExpanded && !collapsed ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
              )}>
                <div className="space-y-1 border-l border-white/5 pl-3">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 group relative h-10 hover:scale-[1.02]",
                          isActive 
                            ? "bg-gradient-to-r from-green-500 to-lime-400 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)]" 
                            : "text-white/50 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <item.icon size={16} className={cn("shrink-0 mr-3 transition-colors", isActive ? "text-white" : "text-white/20 group-hover:text-green-400")} />
                        <span className="text-[11px] font-bold truncate tracking-tight">{item.name}</span>
                        {isActive && (
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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

      {!mobileOnly && (
        <div className="p-4 border-t border-white/5 shrink-0 mb-16 lg:mb-0">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-white/40 hover:text-red-400 hover:bg-red-500/10 gap-3 transition-all duration-300 rounded-xl h-12 hover:scale-[1.02]",
              collapsed ? "justify-center" : "justify-start"
            )} 
            onClick={handleLogout}
          >
            <LogOut size={18} />
            {!collapsed && <span className="font-black text-[10px] uppercase tracking-[0.2em]">{t('sign_out')}</span>}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-full bg-[#0f172a] shadow-2xl transition-all duration-300 z-30 relative",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3 top-24 bg-green-500 border-2 border-[#0f172a] rounded-full h-7 w-7 z-40 hidden lg:flex shadow-xl text-white hover:bg-green-400 transition-all hover:scale-110"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </Button>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-gray-600 rounded-xl hover:bg-gray-50 h-10 w-10">
                  <Menu size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 bg-[#0f172a] border-none w-72 shadow-2xl">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full text-white">
                  <SidebarContent mobileOnly />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 leading-none mb-1">Navigation</h2>
              <span className="text-xs font-bold text-gray-900 leading-none flex items-center gap-2">
                {NAV_GROUPS.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Admin Console'}
                <div className="w-1 h-1 rounded-full bg-green-500" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className="bg-gray-100 border-none rounded-xl h-10 pl-10 pr-4 text-[11px] font-medium w-48 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
              />
            </div>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-green-600 gap-2 h-10 px-3 rounded-xl hover:bg-green-50 transition-all font-bold"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            >
              <Globe size={18} />
              <span className="text-[10px] font-black tracking-widest">{language === 'bn' ? "EN" : "বাং"}</span>
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/10 to-lime-400/10 text-green-600 flex items-center justify-center font-black text-xs border-2 border-white shadow-md">
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
