
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser, useCollection, useMemoFirebase, useDoc, useFirestore } from '@/firebase';
import { collection, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { 
  Users, 
  Loader2,
  ShoppingCart,
  Box,
  ShieldCheck,
  Plus,
  FileText,
  DollarSign,
  Zap,
  UserX,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { useLanguage } from '@/components/providers/language-provider';
import { Skeleton } from '@/components/ui/skeleton';

// 🚀 DYNAMIC IMPORT FOR HEAVY CHART LIBRARY - Client Only
const DashboardChart = dynamic(() => import('recharts').then((mod) => {
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
  return function Chart({ data }: { data: any[] }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2263C0" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2263C0" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
          <YAxis axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px'}} />
          <Area type="monotone" dataKey="revenue" stroke="#2263C0" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };
}), { 
  ssr: false, 
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50/50 rounded-2xl"><Loader2 className="animate-spin text-primary/20" /></div> 
});

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92', 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

const DashboardSkeleton = ({ t }: any) => (
  <div className="space-y-10 animate-in fade-in duration-500">
    <div className="flex justify-between items-center text-left">
      <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /></div>
      <div className="flex gap-2"><Skeleton className="h-10 w-32 rounded-xl" /><Skeleton className="h-10 w-32 rounded-xl" /></div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <Skeleton className="lg:col-span-8 h-[400px] rounded-[2rem]" />
      <Skeleton className="lg:col-span-4 h-[400px] rounded-[2rem]" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const productsEnabled = settings?.productsEnabled !== false;
  const servicesEnabled = settings?.servicesEnabled !== false;

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);
  
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return !!adminRole || 
           BOOTSTRAP_ADMIN_UIDS.includes(user.uid) || 
           user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
  }, [adminRole, user]);

  const ordersQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'orders') : null, [db, isAuthorized]);
  const productsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'products') : null, [db, isAuthorized]);
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const attendanceQuery = useMemoFirebase(() => (db && isAuthorized) ? query(collection(db, 'attendance_logs'), where('date', '==', todayStr)) : null, [db, isAuthorized, todayStr]);

  const { data: ordersRaw, isLoading: oLoading } = useCollection(ordersQuery);
  const { data: productsRaw, isLoading: pLoading } = useCollection(productsQuery);
  const { data: todayAttendance } = useCollection(attendanceQuery);

  const metrics = useMemo(() => {
    if (!ordersRaw || !productsRaw) return null;
    const totalRevenue = ordersRaw.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const idleCount = todayAttendance?.filter(l => l.status === 'No Task').length || 0;
    
    return {
      revenue: totalRevenue,
      pendingProducts: productsRaw.filter(p => p.approvalStatus === 'Pending').length,
      totalOrders: ordersRaw.length,
      idleStaff: idleCount
    };
  }, [ordersRaw, productsRaw, todayAttendance]);

  const chartData = [
    { name: 'Mon', revenue: 15000 },
    { name: 'Tue', revenue: 22000 },
    { name: 'Wed', revenue: 18000 },
    { name: 'Thu', revenue: 35000 },
    { name: 'Fri', revenue: 30000 },
    { name: 'Sat', revenue: 45000 },
    { name: 'Sun', revenue: 42000 },
  ];

  if (!mounted) return null;
  if (isUserLoading || roleLoading || oLoading || pLoading) return <div className="p-8"><DashboardSkeleton t={t} /></div>;

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  const STATS_CARDS = [
    { label: t('admin.revenue'), val: `৳${metrics?.revenue.toLocaleString() || 0}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: t('admin.idle_personnel'), val: metrics?.idleStaff || 0, icon: UserX, color: "text-orange-600", bg: "bg-orange-50", link: "/admin/hrm/attendance" },
    { label: t('admin.pending_items'), val: metrics?.pendingProducts || 0, icon: Box, color: "text-blue-600", bg: "bg-blue-50", hide: !productsEnabled },
    { label: t('admin.total_orders'), val: metrics?.totalOrders || 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50", hide: !productsEnabled },
  ].filter(c => !c.hide);

  return (
    <div className="space-y-10 pb-24 min-w-0 page-transition-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">{t('admin.dashboard_link')}</h1>
          <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('admin.live_status')}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {servicesEnabled && (
            <Button asChild className="h-10 px-6 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 gap-2 text-[10px] uppercase tracking-widest">
              <Link href="/admin/bookings/create"><Plus size={16} strokeWidth={3} /> {t('admin.new_booking')}</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="h-10 px-6 rounded-xl font-black gap-2 text-[10px] uppercase tracking-widest border-gray-200">
            <Link href="/admin/invoices"><FileText size={16} /> {t('admin.ledger_audit')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS_CARDS.map((stat, i) => (
          <Link key={i} href={stat.link || '#'}>
            <Card className="border-none shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all border border-gray-100">
              <CardContent className="p-6 text-left">
                <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-110 group-hover:rotate-6 w-fit shadow-sm mb-4", stat.bg, stat.color)}>
                  <stat.icon size={20} />
                </div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.1em] leading-none mb-1.5">{stat.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-[#081621] tracking-tighter truncate">{stat.val}</h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between text-left">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest">{t('admin.revenue_velocity')}</CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-[0.1em] mt-1 text-primary">7-Day performance analysis</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[380px]">
              <DashboardChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150 transition-transform group-hover:scale-125 duration-1000"><Zap size={160} /></div>
            <CardHeader className="relative z-10 p-8 pb-4 text-left">
              <CardTitle className="text-base font-black uppercase tracking-[0.2em] text-primary">{t('admin.workforce_health')}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-4 text-left">
              {[
                { label: t('admin.idle_personnel'), val: metrics?.idleStaff || 0, icon: UserX, color: "text-rose-400" },
                { label: "Active Techs", val: todayAttendance?.filter(l => l.status === 'Present').length || 0, icon: UserCheck, color: "text-emerald-400" },
                { label: t('admin.staff_directory'), val: metrics?.revenue ? 12 : 0, icon: Users, color: "text-blue-400" }
              ].map((kpi, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-white/10 hover:-translate-y-1">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none">{kpi.label}</p>
                    <span className="text-2xl font-black tracking-tighter italic">{kpi.val}</span>
                  </div>
                  <kpi.icon size={22} className={cn("opacity-40", kpi.color)} strokeWidth={2.5} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
