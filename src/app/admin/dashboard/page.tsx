'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { 
  Users, 
  Database,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Package,
  Wrench,
  Zap,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Store,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [timeFilter, setTimeFilter] = useState('7d');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID;

  const ordersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null, [db, isAuthorized]);
  const productsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'products') : null, [db, isAuthorized]);
  const vendorsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'vendor_profiles') : null, [db, isAuthorized]);
  
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);
  const { data: vendors, isLoading: vendorsLoading } = useCollection(vendorsQuery);

  const metrics = useMemo(() => {
    if (!orders || !products || !vendors) return null;

    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const pendingApprovals = products.filter(p => p.approvalStatus === 'Pending');
    const activeVendors = vendors.filter(v => v.status === 'Approved');

    return {
      revenue: totalRevenue,
      pendingProducts: pendingApprovals.length,
      activeVendors: activeVendors.length,
      totalOrders: orders.length
    };
  }, [orders, products, vendors]);

  const chartData = [
    { name: 'Mon', orders: 12, revenue: 15000 },
    { name: 'Tue', orders: 18, revenue: 22000 },
    { name: 'Wed', orders: 15, revenue: 18000 },
    { name: 'Thu', orders: 25, revenue: 35000 },
    { name: 'Fri', orders: 22, revenue: 30000 },
    { name: 'Sat', orders: 30, revenue: 45000 },
    { name: 'Sun', orders: 28, revenue: 42000 },
  ];

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">Marketplace Insights</h1>
          <div className="text-muted-foreground text-xs md:text-sm font-medium mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Multivendor Environment Monitoring
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button asChild className="flex-1 sm:flex-none rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg gap-2 text-xs h-10">
            <Link href="/admin/products/approvals"><CheckCircle2 size={16} /> Approve Products</Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none rounded-xl font-bold bg-orange-600 hover:bg-orange-700 shadow-lg gap-2 text-xs h-10">
            <Link href="/admin/vendors"><Store size={16} /> Manage Vendors</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Gross Revenue", val: `৳${metrics?.revenue.toLocaleString() || 0}`, trend: "Lifetime Gross", up: true, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Vendors", val: metrics?.activeVendors || 0, trend: "Growth +5%", up: true, icon: Store, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Pending Approvals", val: metrics?.pendingProducts || 0, trend: "Requires Action", up: false, icon: Box, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Dispatch", val: metrics?.totalOrders || 0, trend: "+12% Weekly", up: true, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 md:p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon size={20} className="md:w-6 md:h-6" />
                </div>
                <Badge variant="outline" className={cn("text-[8px] md:text-[9px] font-black border-none uppercase px-2", stat.up ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600")}>
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em] leading-none mb-1">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{stat.val}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Transaction Trends</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest mt-1 text-primary">Sales volume over last 7 days</CardDescription>
              </div>
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
        </div>

        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <Card className="border-none shadow-xl bg-primary text-white rounded-2xl md:rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
            <CardHeader className="relative z-10 p-6 md:p-8 pb-4">
              <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest text-primary-foreground/60">Operations</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-6 md:p-8 pt-0 space-y-4 md:space-y-6">
              {[
                { label: "New Vendors", val: vendors?.filter(v => v.status === 'Pending').length || 0, icon: Store },
                { label: "Review Queue", val: metrics?.pendingProducts || 0, icon: Box },
                { label: "Lifetime Sales", val: (orders?.length || 0).toLocaleString(), icon: TrendingUp }
              ].map((kpi, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/10 flex justify-between items-center group hover:bg-white/20 transition-all">
                  <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-black uppercase opacity-60 leading-none">{kpi.label}</p>
                    <span className="text-xl md:text-2xl font-black">{kpi.val}</span>
                  </div>
                  <kpi.icon size={20} className="md:w-6 md:h-6 opacity-40 group-hover:scale-110 transition-transform" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
