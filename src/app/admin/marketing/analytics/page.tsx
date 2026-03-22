'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  MousePointer2, 
  Users,
  Search,
  ArrowUpRight,
  Info
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

const CHART_DATA = [
  { name: 'Mon', reach: 4000, clicks: 2400 },
  { name: 'Tue', reach: 3000, clicks: 1398 },
  { name: 'Wed', reach: 2000, clicks: 9800 },
  { name: 'Thu', reach: 2780, clicks: 3908 },
  { name: 'Fri', reach: 1890, clicks: 4800 },
  { name: 'Sat', reach: 2390, clicks: 3800 },
  { name: 'Sun', reach: 3490, clicks: 4300 },
];

export default function MarketingAnalyticsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Campaign Performance</h1>
          <p className="text-muted-foreground text-sm font-medium">Deep-dive into ad attribution and customer journey maps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Ad Impressions", val: "124.5k", trend: "+12%", icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Click Through Rate", val: "3.2%", trend: "+0.5%", icon: MousePointer2, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Ad ROAS", val: "4.8x", trend: "+1.2x", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Cost Per Order", val: "৳145", trend: "-৳12", icon: Search, color: "text-orange-600", bg: "bg-orange-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight size={12} /> {stat.trend}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stat.val}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-8">
            <CardTitle className="text-base font-bold uppercase tracking-tight">Traffic vs Conversion Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="reach" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Channel Attribution</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              {[
                { label: "Facebook Ads", val: 65, color: "bg-blue-500" },
                { label: "Direct Search", val: 20, color: "bg-green-500" },
                { label: "Organic Social", val: 10, color: "bg-purple-500" },
                { label: "Referrals", val: 5, color: "bg-amber-500" }
              ].map((channel, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span>{channel.label}</span>
                    <span>{channel.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${channel.color}`} style={{ width: `${channel.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-primary mt-0.5" />
                <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                  Attribution is calculated using a 7-day click and 1-day view standard window.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
