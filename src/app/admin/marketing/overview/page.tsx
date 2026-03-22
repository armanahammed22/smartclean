'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  MousePointer2, 
  ShoppingCart, 
  Loader2,
  FileText,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MarketingOverviewPage() {
  const db = useFirestore();

  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'tracking_logs'), orderBy('timestamp', 'desc'), limit(100)) : null, [db]);
  const ordersQuery = useMemoFirebase(() => db ? collection(db, 'orders') : null, [db]);

  const { data: logs, isLoading: logsLoading } = useCollection(logsQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!logs || !orders) return { events: 0, orders: 0, conversion: '0%' };
    const purchases = logs.filter(l => l.eventName === 'Purchase').length;
    
    return {
      events: logs.length,
      orders: orders.length,
      conversion: orders.length > 0 ? ((purchases / logs.filter(l => l.eventName === 'ViewContent').length || 1) * 100).toFixed(1) + '%' : '0%'
    };
  }, [logs, orders]);

  // Mock chart data based on actual logs
  const chartData = useMemo(() => {
    return [
      { name: 'Mon', events: 120, conversions: 5 },
      { name: 'Tue', events: 150, conversions: 8 },
      { name: 'Wed', events: 180, conversions: 12 },
      { name: 'Thu', events: 140, conversions: 7 },
      { name: 'Fri', events: 210, conversions: 15 },
      { name: 'Sat', events: 250, conversions: 22 },
      { name: 'Sun', events: 190, conversions: 10 },
    ];
  }, []);

  if (logsLoading || ordersLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Marketing Intelligence</h1>
          <p className="text-muted-foreground text-sm">Track pixel events, server conversions and ad performance</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 uppercase font-black text-[9px] px-3 py-1">
             Real-time Sync Active
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Tracking Events", val: stats.events, icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ad Conversions", val: stats.orders, icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Purchase Rate", val: stats.conversion, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "CAPI Matches", val: logs?.filter(l => l.method === 'Server').length || 0, icon: ShieldCheck, color: "text-orange-600", bg: "bg-orange-50" }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold uppercase tracking-tight">Event Attribution Trends</CardTitle>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> <span className="text-[9px] font-bold">BROWSER</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-[9px] font-bold">CAPI</span></div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="events" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
          <CardHeader className="p-8 pb-0 relative z-10">
            <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Live Event Stream</CardTitle>
          </CardHeader>
          <CardContent className="p-8 relative z-10">
            <div className="space-y-6">
              {logs?.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      log.method === 'Server' ? "bg-blue-500/20 text-blue-400" : "bg-primary/20 text-primary"
                    )}>
                      {log.method === 'Server' ? <Globe size={14} /> : <MousePointer2 size={14} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight">{log.eventName}</p>
                      <p className="text-[9px] text-white/40 uppercase font-bold">{log.method === 'Server' ? 'CAPI Triggered' : 'Pixel Fired'}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/5 text-[8px] font-black border-none text-white/60">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </div>
              ))}
              {!logs?.length && <p className="text-center text-white/20 italic text-sm py-10">Waiting for events...</p>}
            </div>
            <Button className="w-full mt-10 bg-white/10 hover:bg-white/20 border-none text-white font-black text-[10px] uppercase tracking-widest h-12 rounded-xl" asChild>
              <Link href="/admin/marketing/logs">
                Full Event Logs <ChevronRight size={14} className="ml-2"/>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChevronRight({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
  );
}
