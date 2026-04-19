'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useDoc, useFirestore } from '@/firebase';
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
  Tags,
  FileText,
  Clock,
  Wallet,
  Activity,
  History,
  ReceiptText,
  ArrowRight,
  UserX
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
import { format } from 'date-fns';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92', 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);
  
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return !!adminRole || 
           BOOTSTRAP_ADMIN_UIDS.includes(user.uid) || 
           user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
  }, [adminRole, user]);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const ordersQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null, [db, isAuthorized]);
  const productsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'products') : null, [db, isAuthorized]);
  const servicesQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'services') : null, [db, isAuthorized]);
  const usersQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'users') : null, [db, isAuthorized]);
  
  // Attendance Monitoring
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const attendanceQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'attendance_logs'), where('date', '==', todayStr)) : null, [db, isAuthorized]);

  const { data: orders } = useCollection(ordersQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: dbServices } = useCollection(servicesQuery);
  const { data: dbUsers } = useCollection(usersQuery);
  const { data: todayAttendance } = useCollection(attendanceQuery);

  const metrics = useMemo(() => {
    if (!orders || !products) return null;
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const idleCount = todayAttendance?.filter(l => l.status === 'No Task').length || 0;
    
    return {
      revenue: totalRevenue,
      pendingProducts: products.filter(p => p.approvalStatus === 'Pending').length,
      totalOrders: orders.length,
      idleStaff: idleCount
    };
  }, [orders, products, todayAttendance]);

  const chartData = [
    { name: 'Mon', revenue: 15000 },
    { name: 'Tue', revenue: 22000 },
    { name: 'Wed', revenue: 18000 },
    { name: 'Thu', revenue: 35000 },
    { name: 'Fri', revenue: 30000 },
    { name: 'Sat', revenue: 45000 },
    { name: 'Sun', revenue: 42000 },
  ];

  if (isUserLoading || roleLoading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Loading Terminal...</p>
    </div>
  );

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  const STATS_CARDS = [
    { label: "Gross Revenue", val: `৳${metrics?.revenue.toLocaleString() || 0}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Idle Personnel", val: metrics?.idleStaff || 0, icon: UserX, color: "text-orange-600", bg: "bg-orange-50", link: "/admin/hrm/attendance" },
    { label: "Pending Approvals", val: metrics?.pendingProducts || 0, icon: Box, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Orders", val: metrics?.totalOrders || 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">Admin Overview</h1>
          <div className="text-muted-foreground text-[10px] md:text-sm font-medium mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Operational
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <Button asChild className="flex-1 sm:flex-none rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg gap-2 text-[10px] md:text-xs h-10 uppercase">
            <Link href="/admin/bookings?create=true"><Plus size={16} /> New Booking</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS_CARDS.map((stat, i) => (
          <Link key={i} href={stat.link || '#'}>
            <Card className="border-none shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all h-full">
              <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className={cn("p-2 md:p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                    <stat.icon size={18} className="md:w-6 md:h-6" />
                  </div>
                </div>
                <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em] leading-none mb-1">{stat.label}</p>
                <h3 className="text-base md:text-2xl font-black text-gray-900 tracking-tight truncate">{stat.val}</h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 min-w-0 space-y-6 md:space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-5 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base md:text-lg font-bold">Revenue Growth</CardTitle>
                <CardDescription className="text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-1 text-primary">Financial performance trends</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-8 h-[250px] md:h-[400px]">
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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={9} fontStyle="bold" />
                    <YAxis axisLine={false} tickLine={false} fontSize={9} fontStyle="bold" />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#2263C0" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 md:gap-8 min-w-0">
          <Card className="border-none shadow-xl bg-primary text-white rounded-2xl md:rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
            <CardHeader className="relative z-10 p-6 md:p-8 pb-4">
              <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest text-primary-foreground/60">Workforce Health</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-6 md:p-8 pt-0 space-y-3 md:space-y-6">
              {[
                { label: "Idle Today", val: metrics?.idleStaff || 0, icon: UserX },
                { label: "Active Techs", val: todayAttendance?.filter(l => l.status === 'Present').length || 0, icon: UserCheck },
                { label: "Total Personnel", val: dbUsers?.length || 0, icon: Users }
              ].map((kpi, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[10px] font-black uppercase opacity-60 leading-none">{kpi.label}</p>
                    <span className="text-lg md:text-2xl font-black">{kpi.val}</span>
                  </div>
                  <kpi.icon size={18} className="md:w-6 md:h-6 opacity-40" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
