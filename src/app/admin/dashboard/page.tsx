
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, limit, where, writeBatch, setDoc } from 'firebase/firestore';
import { 
  Users, 
  Loader2,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Package,
  Wrench,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  DollarSign,
  Store,
  Box,
  LayoutDashboard,
  Database,
  ShieldCheck,
  RefreshCw,
  Plus,
  ClipboardList,
  Tags
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getMockServices, getMockSubServices } from '@/lib/data';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92'];

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || (user && BOOTSTRAP_ADMIN_UIDS.includes(user.uid));

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const ordersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null, [db, isAuthorized]);
  const productsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'products') : null, [db, isAuthorized]);
  const vendorsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'vendor_profiles') : null, [db, isAuthorized]);
  const servicesQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'services') : null, [db, isAuthorized]);
  const usersQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'users') : null, [db, isAuthorized]);
  const leadsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'leads') : null, [db, isAuthorized]);
  const requestsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'custom_requests') : null, [db, isAuthorized]);
  const bookingsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'bookings') : null, [db, isAuthorized]);
  
  const { data: orders } = useCollection(ordersQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: vendors } = useCollection(vendorsQuery);
  const { data: dbServices, isLoading: servicesLoading } = useCollection(servicesQuery);
  const { data: dbUsers } = useCollection(usersQuery);
  const { data: dbLeads } = useCollection(leadsQuery);
  const { data: dbRequests } = useCollection(requestsQuery);
  const { data: dbBookings } = useCollection(bookingsQuery);

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      
      const services = getMockServices('en');
      const subServices = getMockSubServices();

      services.forEach(srv => {
        const sRef = doc(db, 'services', srv.id);
        batch.set(sRef, {
          ...srv,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      subServices.forEach((sub, idx) => {
        const subId = `sub_srv_${idx + 1}`;
        const subRef = doc(db, 'sub_services', subId);
        
        batch.set(subRef, {
          ...sub,
          id: subId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      toast({ title: "ERP Data Seeded", description: "All services and sub-services are now live." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Seeding Failed", description: e.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const metrics = useMemo(() => {
    if (!orders || !products || !vendors) return null;
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    return {
      revenue: totalRevenue,
      pendingProducts: products.filter(p => p.approvalStatus === 'Pending').length,
      activeVendors: vendors.filter(v => v.status === 'Approved').length,
      totalOrders: orders.length
    };
  }, [orders, products, vendors]);

  const chartData = [
    { name: 'Mon', revenue: 15000 },
    { name: 'Tue', revenue: 22000 },
    { name: 'Wed', revenue: 18000 },
    { name: 'Thu', revenue: 35000 },
    { name: 'Fri', revenue: 30000 },
    { name: 'Sat', revenue: 45000 },
    { name: 'Sun', revenue: 42000 },
  ];

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  const showSeedButton = !servicesLoading && servicesEnabled && (!dbServices || dbServices.length === 0);

  const STATS_CARDS = [
    { label: "Gross Revenue", val: `৳${metrics?.revenue.toLocaleString() || 0}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
    ...(productsEnabled ? [{ label: "Active Vendors", val: metrics?.activeVendors || 0, icon: Store, color: "text-orange-600", bg: "bg-orange-50" }] : []),
    ...(productsEnabled ? [{ label: "Pending Approvals", val: metrics?.pendingProducts || 0, icon: Box, color: "text-blue-600", bg: "bg-blue-50" }] : []),
    { label: "Total Orders", val: metrics?.totalOrders || 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const REGISTRY_STATS = [
    { label: "Users", count: dbUsers?.length || 0, icon: Users, color: "text-blue-500" },
    { label: "Leads", count: dbLeads?.length || 0, icon: TrendingUp, color: "text-purple-500" },
    { label: "Requests", count: dbRequests?.length || 0, icon: ClipboardList, color: "text-orange-500" },
    { label: "Bookings", count: dbBookings?.length || 0, icon: Calendar, color: "text-emerald-500" },
    { label: "Products", count: products?.length || 0, icon: Box, color: "text-amber-500" },
    { label: "Services", count: dbServices?.length || 0, icon: Wrench, color: "text-sky-500" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">Global Overview</h1>
          <div className="text-muted-foreground text-xs md:text-sm font-medium mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Terminal Operational
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          {productsEnabled && (
            <Button asChild className="flex-1 sm:flex-none rounded-xl font-black bg-blue-600 hover:bg-blue-700 shadow-lg gap-2 text-xs h-10 uppercase">
              <Link href="/admin/orders?create=true"><Plus size={16} /> New Order</Link>
            </Button>
          )}
          {servicesEnabled && (
            <Button asChild className="flex-1 sm:flex-none rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg gap-2 text-xs h-10 uppercase">
              <Link href="/admin/bookings?create=true"><Plus size={16} /> New Booking</Link>
            </Button>
          )}
          {showSeedButton && (
            <Button 
              onClick={handleSeedData} 
              disabled={isSeeding} 
              variant="outline" 
              className="flex-1 sm:flex-none rounded-xl font-black bg-white border-primary/20 text-primary shadow-sm gap-2 text-[10px] h-10 uppercase tracking-widest"
            >
              {isSeeding ? <RefreshCw className="animate-spin" size={14} /> : <Database size={14} />}
              Seed ERP Data
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS_CARDS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 md:p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon size={20} className="md:w-6 md:h-6" />
                </div>
              </div>
              <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em] leading-none mb-1">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{stat.val}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 min-w-0 space-y-6 md:space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Revenue Growth</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest mt-1 text-primary">Financial performance trends</CardDescription>
              </div>
              <Button variant="ghost" className="text-xs font-bold text-primary gap-2" asChild>
                <Link href="/admin/reports">View Full Reports <ArrowUpRight size={14} /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-8 h-[300px] md:h-[400px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2263C0" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2263C0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#2263C0" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6 md:p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                <Database className="text-primary" size={20} /> Firestore Registry Check
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Live counts across core collection nodes</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {REGISTRY_STATS.map((reg, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white hover:shadow-xl transition-all">
                    <div className={cn("p-2 rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110", reg.color)}>
                      <reg.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[18px] font-black text-gray-900 leading-none">{reg.count}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">{reg.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 md:gap-8 min-w-0">
          <Card className="border-none shadow-xl bg-primary text-white rounded-2xl md:rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
            <CardHeader className="relative z-10 p-6 md:p-8 pb-4">
              <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest text-primary-foreground/60">Quick Metrics</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-6 md:p-8 pt-0 space-y-4 md:space-y-6">
              {[
                ...(productsEnabled ? [{ label: "Pending Vendors", val: vendors?.filter(v => v.status === 'Pending').length || 0, icon: Store }] : []),
                ...(productsEnabled ? [{ label: "Review Queue", val: metrics?.pendingProducts || 0, icon: Box }] : []),
                ...(servicesEnabled ? [{ label: "Active Services", val: dbServices?.length || 0, icon: Wrench }] : [])
              ].map((kpi, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-black uppercase opacity-60 leading-none">{kpi.label}</p>
                    <span className="text-xl md:text-2xl font-black">{kpi.val}</span>
                  </div>
                  <kpi.icon size={20} className="md:w-6 md:h-6 opacity-40" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
