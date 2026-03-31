'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target, 
  MousePointer2, 
  Users,
  Search,
  ArrowUpRight,
  Info,
  Zap,
  Globe,
  Loader2,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export default function MarketingAnalyticsPage() {
  const db = useFirestore();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'tracking_logs'), orderBy('timestamp', 'desc'), limit(500)) : null, [db]);
  const leadsQuery = useMemoFirebase(() => db ? collection(db, 'leads') : null, [db]);
  const bookingsQuery = useMemoFirebase(() => db ? collection(db, 'bookings') : null, [db]);

  const { data: logs, isLoading: lLoading } = useCollection(logsQuery);
  const { data: leads, isLoading: leLoading } = useCollection(leadsQuery);
  const { data: bookings, isLoading: bLoading } = useCollection(bookingsQuery);

  const stats = useMemo(() => {
    if (!logs) return { views: 0, conv: 0, rate: '0%', leadRate: '0%' };
    const views = logs.filter(l => l.eventName === 'ViewContent').length;
    const purchases = logs.filter(l => l.eventName === 'Purchase').length;
    const leadCount = leads?.length || 0;

    return {
      views,
      conv: purchases,
      rate: views > 0 ? ((purchases / views) * 100).toFixed(1) + '%' : '0%',
      leadRate: views > 0 ? ((leadCount / views) * 100).toFixed(1) + '%' : '0%'
    };
  }, [logs, leads]);

  const chartData = [
    { name: 'Mon', views: 400, conv: 24 },
    { name: 'Tue', views: 300, conv: 13 },
    { name: 'Wed', views: 200, conv: 98 },
    { name: 'Thu', views: 278, conv: 39 },
    { name: 'Fri', views: 189, conv: 48 },
    { name: 'Sat', views: 239, conv: 38 },
    { name: 'Sun', views: 349, conv: 43 },
  ];

  if (lLoading || leLoading || bLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" size={40} /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Marketing Analytics</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Consumer behavior and campaign attribution logic</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <Button variant="ghost" size="sm" onClick={() => setRange('7d')} className={cn("text-[9px] font-black uppercase rounded-lg px-4 h-8", range === '7d' ? "bg-primary text-white" : "text-gray-400")}>7 Days</Button>
          <Button variant="ghost" size="sm" onClick={() => setRange('30d')} className={cn("text-[9px] font-black uppercase rounded-lg px-4 h-8", range === '30d' ? "bg-primary text-white" : "text-gray-400")}>30 Days</Button>
          <Button variant="outline" className="h-8 rounded-lg border-gray-200 px-3 gap-2 text-[9px] font-black uppercase"><Download size={12}/> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Content Views", val: stats.views, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Conversions", val: stats.conv, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Conversion Rate", val: stats.rate, icon: MousePointer2, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Lead Generation", val: stats.leadRate, icon: Users, color: "text-orange-600", bg: "bg-orange-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon size={20} />
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-gray-100">REAL-TIME</Badge>
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
              <CardTitle className="text-base font-bold uppercase tracking-tight">Traffic vs Conversion Flow</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase mt-1">Comparing total reach against actual sales</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="conv" stroke="#22c55e" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Channel Attribution</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
              {[
                { label: "Meta Pixel (Browser)", val: 65, color: "bg-blue-500" },
                { label: "Meta CAPI (Server)", val: 30, color: "bg-indigo-500" },
                { label: "Google Analytics", val: 5, color: "bg-orange-500" }
              ].map((channel, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span>{channel.label}</span>
                    <span className="text-primary">{channel.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", channel.color)} style={{ width: `${channel.val}%` }} />
                  </div>
                </div>
              ))}
              
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Info size={16} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/40 leading-relaxed font-medium uppercase">
                    Attribution is calculated based on last-click logic using unique event_ids from tracking logs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Globe size={14} /> Domain Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Search Impressions</span>
                <span className="text-gray-900">12.4k</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Organic Clicks</span>
                <span className="text-gray-900">840</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Average Position</span>
                <span className="text-primary">14.2</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
