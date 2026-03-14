'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Database,
  Loader2,
  Package,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  ResponsiveContainer 
} from 'recharts';

const CHART_DATA = [
  { name: 'Jan', revenue: 45000, profit: 12000 },
  { name: 'Feb', revenue: 52000, profit: 15000 },
  { name: 'Mar', revenue: 48000, profit: 10000 },
  { name: 'Apr', revenue: 61000, profit: 18000 },
  { name: 'May', revenue: 55000, profit: 14000 },
  { name: 'Jun', revenue: 67000, profit: 22000 },
];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const leadsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(5));
  }, [db]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
  }, [db]);

  const { data: recentLeads } = useCollection(leadsQuery);
  const { data: recentOrders } = useCollection(ordersQuery);

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      const leads = [
        { name: "Rahim Ahmed", phone: "01711223344", email: "rahim@example.com", address: "Gulshan 2, Dhaka", status: "New", source: "Facebook", createdAt: new Date().toISOString() },
        { name: "Sara Islam", phone: "01811556677", email: "sara@example.com", address: "Banani Road 11", status: "Qualified", source: "Google Maps", createdAt: new Date().toISOString() },
      ];
      leads.forEach(l => batch.set(doc(collection(db, 'leads')), l));

      const orders = [
        { customerName: "Karim Khan", totalAmount: 12500, status: "Delivered", paymentStatus: "Paid", createdAt: new Date().toISOString() },
        { customerName: "Lily Begum", totalAmount: 4500, status: "Processing", paymentStatus: "Unpaid", createdAt: new Date().toISOString() },
      ];
      orders.forEach(o => batch.set(doc(collection(db, 'orders')), o));

      await batch.commit();
      toast({ title: "ERP Seeded", description: "Database populated with sample ERP data." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seed Failed", description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading) return <div className="p-8 text-center">Verifying Access...</div>;

  const STATS = [
    { title: "Total Sales", value: "৳2,45,000", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", trend: "+12.5%", isUp: true },
    { title: "Total Orders", value: "124", icon: Package, color: "text-amber-600", bg: "bg-amber-50", trend: "+8.2%", isUp: true },
    { title: "Revenue", value: "৳1,82,000", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+14.1%", isUp: true },
    { title: "Profit / Loss", value: "৳42,500", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", trend: "+5.4%", isUp: true },
    { title: "Total Customers", value: "842", icon: Users, color: "text-primary", bg: "bg-primary/10", trend: "+2.3%", isUp: true },
    { title: "Services Booked", value: "48", icon: CalendarCheck, color: "text-pink-600", bg: "bg-pink-50", trend: "+10.2%", isUp: true },
    { title: "Pending Orders", value: "12", icon: Clock, color: "text-orange-600", bg: "bg-orange-50", trend: "-2.1%", isUp: false },
    { title: "Completed Orders", value: "112", icon: CheckCircle2, color: "text-cyan-600", bg: "bg-cyan-50", trend: "+9.5%", isUp: true },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time performance metrics</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSeedData} 
          disabled={isSeeding}
          className="gap-2 bg-white font-bold shadow-sm"
        >
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed ERP Data
        </Button>
      </div>

      {/* KPI GRID: 2 cols on mobile/tablet, 3 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2.5 rounded-xl transition-colors", stat.bg, stat.color)}>
                    <stat.icon size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full",
                    stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                  <h3 className="text-lg md:text-2xl font-black text-gray-900">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp size={120} />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-bold relative z-10">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">Conversion Rate</span>
                <span className="font-black text-xl">4.2%</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">Avg. Ticket Size</span>
                <span className="font-black text-xl">৳5,200</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">Customer Retention</span>
                <span className="font-black text-xl">68%</span>
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-black h-12 mt-4 shadow-xl">
               View Full Report
             </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs font-semibold">{order.customerName}</TableCell>
                    <TableCell className="text-xs font-black text-primary">৳{order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={3} className="text-center py-10 italic text-muted-foreground">No recent orders</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg font-bold">New Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Source</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads?.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs font-semibold">{lead.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.source}</TableCell>
                    <TableCell>
                      <Badge className="text-[9px] font-black uppercase tracking-tighter">{lead.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={3} className="text-center py-10 italic text-muted-foreground">No new leads</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
