
'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  UserPlus,
  ArrowUpRight,
  ClipboardList,
  Database,
  Loader2,
  ShoppingCart,
  DollarSign,
  Package
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
  Cell 
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

  const { data: recentLeads, isLoading: leadsLoading } = useCollection(leadsQuery);
  const { data: recentOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      // Seed Leads
      const leads = [
        { name: "Rahim Ahmed", phone: "01711223344", email: "rahim@example.com", address: "Gulshan 2, Dhaka", status: "New", source: "Facebook", createdAt: new Date().toISOString() },
        { name: "Sara Islam", phone: "01811556677", email: "sara@example.com", address: "Banani Road 11", status: "Qualified", source: "Google Maps", createdAt: new Date().toISOString() },
      ];
      leads.forEach(l => batch.set(doc(collection(db, 'leads')), l));

      // Seed Orders
      const orders = [
        { customerName: "Karim Khan", totalAmount: 12500, status: "Delivered", paymentStatus: "Paid", createdAt: new Date().toISOString() },
        { customerName: "Lily Begum", totalAmount: 4500, status: "Processing", paymentStatus: "Unpaid", createdAt: new Date().toISOString() },
      ];
      orders.forEach(o => batch.set(doc(collection(db, 'orders')), o));

      // Seed Service Areas
      const areas = [
        { name: "Dhaka Metro", status: "Active" },
        { name: "Gazipur", status: "Active" },
        { name: "Chittagong", status: "Inactive" },
      ];
      areas.forEach(a => batch.set(doc(collection(db, 'service_areas')), a));

      await batch.commit();
      toast({ title: "ERP Seeded", description: "All modules populated with realistic sample data." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seed Failed", description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading) return <div className="p-8 text-center">Authenticating ERP Access...</div>;

  const STATS = [
    { title: "Total Revenue", value: "৳2,45,000", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { title: "Active Orders", value: recentOrders?.length || "0", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Service Leads", value: recentLeads?.length || "0", icon: UserPlus, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Total Customers", value: "842", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">ERP Overview</h1>
          <p className="text-muted-foreground text-sm">Unified control for Ecommerce & Services</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="gap-2 bg-white font-bold"
          >
            {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
            Seed ERP Data
          </Button>
          <Badge className="bg-primary text-white px-3 py-1">Enterprise Plan</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase">{stat.title}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue & Profit Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#2263C0" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="profit" fill="#14AD66" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80">Conversion Rate</span>
                <span className="font-bold text-xl">4.2%</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80">Avg. Order Value</span>
                <span className="font-bold text-xl">৳5,200</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80">Return Rate</span>
                <span className="font-bold text-xl text-red-300">1.8%</span>
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold">Download Full Report</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-xs">{order.customerName}</TableCell>
                    <TableCell className="text-xs font-bold">৳{order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">No orders found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Service Leads */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Service Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium text-xs">{lead.name}</TableCell>
                    <TableCell>
                      <Badge className="text-[10px] uppercase font-bold">
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                    </TableCell>
                  </TableRow>
                )) || (
                   <TableRow><TableCell colSpan={3} className="text-center py-8">No leads found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
