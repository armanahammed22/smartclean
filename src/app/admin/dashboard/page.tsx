'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  UserPlus,
  Database,
  Loader2,
  Package,
  CalendarCheck
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
    { title: "Revenue", value: "৳2,45,000", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { title: "Orders", value: recentOrders?.length || "0", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Bookings", value: "24", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Customers", value: "842", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time performance metrics</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSeedData} 
          disabled={isSeeding}
          className="gap-2 bg-white font-bold"
        >
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed ERP Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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

        <Card className="border-none shadow-sm bg-primary text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-sm opacity-80">Conversion</span>
                <span className="font-bold">4.2%</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-sm opacity-80">Avg. Order</span>
                <span className="font-bold">৳5,200</span>
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold mt-4">Full Report</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
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
                    <TableCell className="text-xs font-medium">{order.customerName}</TableCell>
                    <TableCell className="text-xs font-bold">৳{order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase">{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={3} className="text-center py-4">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">New Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-xs font-medium">{lead.name}</TableCell>
                    <TableCell className="text-xs">{lead.source}</TableCell>
                    <TableCell>
                      <Badge className="text-[10px] uppercase">{lead.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={3} className="text-center py-4">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
