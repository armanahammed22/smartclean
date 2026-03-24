
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
  DollarSign
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
  LineChart,
  Line,
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
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState('7d');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID;

  const ordersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null, [db, isAuthorized]);
  const bookingsQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc')) : null, [db, isAuthorized]);
  const productsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'products') : null, [db, isAuthorized]);
  
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const metrics = useMemo(() => {
    if (!orders || !bookings || !products) return null;

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
    const pendingOrders = orders.filter(o => o.status === 'New' || o.status === 'Processing');
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const lowStockItems = products.filter(p => (p.stockQuantity || 0) < 5);

    return {
      todayCount: todayOrders.length,
      pendingCount: pendingOrders.length,
      deliveredCount: deliveredOrders.length,
      revenue: totalRevenue,
      lowStock: lowStockItems,
      pendingBookings: bookings.filter(b => b.status === 'New').length
    };
  }, [orders, bookings, products]);

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
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">Business Control Center</h1>
          <div className="text-muted-foreground text-xs md:text-sm font-medium mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Marketplace Intelligence & Operations
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button asChild className="flex-1 sm:flex-none rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg gap-2 text-xs h-10">
            <Link href="/admin/products"><Plus size={16} /> Add Product</Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg gap-2 text-xs h-10">
            <Link href="/admin/services"><Plus size={16} /> Add Service</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto rounded-xl font-bold bg-purple-600 hover:bg-purple-700 shadow-lg gap-2 text-xs h-10">
            <Link href="/admin/marketing/landing-pages"><Plus size={16} /> Landing Page</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Today's Orders", val: metrics?.todayCount || 0, trend: "+12%", up: true, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Fulfillment", val: metrics?.pendingCount || 0, trend: "High Priority", up: false, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Delivered Items", val: metrics?.deliveredCount || 0, trend: "+5% vs Last Week", up: true, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Revenue", val: `৳${metrics?.revenue.toLocaleString() || 0}`, trend: "Lifetime Gross", up: true, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
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
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Volume & Revenue Trend</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest mt-1 text-primary">Performance over last 7 days</CardDescription>
              </div>
              <div className="flex bg-white rounded-xl border p-1 w-full sm:w-auto">
                {['7d', '30d'].map(f => (
                  <button key={f} onClick={() => setTimeFilter(f)} className={cn("flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", timeFilter === f ? "bg-primary text-white" : "text-gray-400")}>
                    {f}
                  </button>
                ))}
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
                    <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6 md:p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg font-bold uppercase tracking-tight">Real-time Order Feed</CardTitle>
                <Button variant="link" className="text-[10px] md:text-xs font-black uppercase text-primary p-0" asChild>
                  <Link href="/admin/orders">Full Dispatch <ArrowUpRight size={14} /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-full">
                <Table className="min-w-[600px]">
                  <TableHeader className="bg-gray-50/30">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] pl-8">Customer</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Details</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-right pr-8">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                    ) : orders?.slice(0, 6).map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="pl-8 py-4">
                          <div className="font-bold text-sm text-gray-900 leading-none mb-1">{order.customerName}</div>
                          <div className="text-[10px] text-muted-foreground font-medium">{order.customerPhone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[10px] font-bold text-gray-600 uppercase truncate max-w-[150px]">
                            {order.items?.[0]?.name || 'N/A'}
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">{mounted && order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : '...'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(
                            "text-[8px] font-black uppercase border-none",
                            order.status === 'New' ? "bg-blue-50 text-blue-600" :
                            order.status === 'Delivered' ? "bg-green-50 text-green-600" :
                            order.status === 'Cancelled' ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8 font-black text-sm text-gray-900">
                          ৳{order.totalPrice?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                { label: "Pending Orders", val: metrics?.pendingCount || 0, icon: Package },
                { label: "Pending Bookings", val: metrics?.pendingBookings || 0, icon: Calendar },
                { label: "Lifetime Orders", val: (orders?.length || 0).toLocaleString(), icon: TrendingUp }
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

          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-red-100">
            <CardHeader className="bg-red-50/50 p-6 md:p-8 flex flex-row items-center justify-between border-b border-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={20} /></div>
                <CardTitle className="text-sm md:text-base font-bold text-red-900">Inventory Guard</CardTitle>
              </div>
              <Badge className="bg-red-600 text-white border-none text-[10px] font-black">{metrics?.lowStock.length || 0}</Badge>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-4">
              {metrics?.lowStock.length ? metrics.lowStock.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black text-[10px] text-red-600">{item.stockQuantity}</div>
                    <span className="text-[10px] md:text-[11px] font-bold text-gray-700 uppercase truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-100 text-red-600" asChild>
                    <Link href={`/admin/products`}><ArrowUpRight size={14} /></Link>
                  </Button>
                </div>
              )) : (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 size={32} className="text-green-500 mx-auto" />
                  <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">Stock Levels Healthy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
