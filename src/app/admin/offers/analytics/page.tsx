'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  MousePointer2, 
  ShoppingCart, 
  Loader2,
  FileText,
  ShieldCheck,
  Globe,
  TicketPercent,
  History,
  Activity
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function OffersAnalyticsPage() {
  const db = useFirestore();

  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'tracking_logs'), orderBy('timestamp', 'desc'), limit(100)) : null, [db]);
  const couponsQuery = useMemoFirebase(() => db ? collection(db, 'coupons') : null, [db]);
  const requestsQuery = useMemoFirebase(() => db ? collection(db, 'custom_requests') : null, [db]);
  const campaignsQuery = useMemoFirebase(() => db ? collection(db, 'campaigns') : null, [db]);

  const { data: logs, isLoading: lLoading } = useCollection(logsQuery);
  const { data: coupons, isLoading: cLoading } = useCollection(couponsQuery);
  const { data: requests, isLoading: rLoading } = useCollection(requestsQuery);
  const { data: campaigns, isLoading: caLoading } = useCollection(campaignsQuery);

  const metrics = useMemo(() => {
    if (!logs || !coupons || !requests || !campaigns) return null;
    
    const promoEvents = logs.filter(l => l.eventName === 'Purchase' && l.payload?.couponCode);
    const conversionRate = logs.length > 0 ? ((promoEvents.length / logs.length) * 100).toFixed(1) : '0';

    return {
      activeCampaigns: campaigns.filter(c => c.isActive).length,
      totalCoupons: coupons.length,
      totalRequests: requests.length,
      conversionRate: `${conversionRate}%`,
      promoClicks: logs.filter(l => l.eventName === 'ViewContent').length,
      revenue: 125000 // Mock for now
    };
  }, [logs, coupons, requests, campaigns]);

  const chartData = [
    { name: 'Mon', clicks: 400, conv: 24 },
    { name: 'Tue', clicks: 300, conv: 13 },
    { name: 'Wed', clicks: 200, conv: 98 },
    { name: 'Thu', clicks: 278, conv: 39 },
    { name: 'Fri', clicks: 189, conv: 48 },
    { name: 'Sat', clicks: 239, conv: 38 },
    { name: 'Sun', clicks: 349, conv: 43 },
  ];

  if (lLoading || cLoading || rLoading || caLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Offers Overview & Analytics</h1>
          <p className="text-muted-foreground text-sm font-medium">Global tracking for campaigns, coupons and smart pricing performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Campaigns", val: metrics?.activeCampaigns, icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Coupons Registry", val: metrics?.totalCoupons, icon: TicketPercent, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Custom Requests", val: metrics?.totalRequests, icon: History, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Conversion rate", val: metrics?.conversionRate, icon: Activity, color: "text-orange-600", bg: "bg-orange-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className={cn("p-2.5 w-fit rounded-xl mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stat.val}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold uppercase tracking-tight">Campaign Clicks vs Conversions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2263C0" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2263C0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="clicks" stroke="#2263C0" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                <Area type="monotone" dataKey="conv" stroke="#22c55e" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
            <CardHeader className="p-8 pb-0 relative z-10">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-8 relative z-10">
              <div className="space-y-6">
                {logs?.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <Target size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tight">{log.eventName}</p>
                        <p className="text-[9px] text-white/40 uppercase font-bold">1 min ago</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
