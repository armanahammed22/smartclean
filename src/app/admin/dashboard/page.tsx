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
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const leadsQuery = useMemoFirebase(() => db ? query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);
  const ordersQuery = useMemoFirebase(() => db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);

  const { data: recentLeads } = useCollection(leadsQuery);
  const { data: recentOrders } = useCollection(ordersQuery);

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      // 1. Categories
      const cats = [
        { id: 'cat1', name: 'Home Appliances', status: 'Active', slug: 'home-appliances' },
        { id: 'cat2', name: 'Cleaning Supplies', status: 'Active', slug: 'cleaning-supplies' }
      ];
      cats.forEach(c => batch.set(doc(db, 'product_categories', c.id), c));

      // 2. Products
      const products = [
        { id: 'p1', name: "Smart Vacuum Robot", price: 49999, categoryId: "cat1", status: "Active", onSale: true, imageUrl: "https://picsum.photos/seed/v1/600/400", stockQuantity: 12, createdAt: new Date().toISOString() },
        { id: 'p2', name: "Eco-Friendly Kit", price: 4500, categoryId: "cat2", status: "Active", onSale: false, imageUrl: "https://picsum.photos/seed/v2/600/400", stockQuantity: 45, createdAt: new Date().toISOString() },
      ];
      products.forEach(p => batch.set(doc(db, 'products', p.id), p));

      // 3. Services
      const services = [
        { id: 's1', title: 'Home Deep Clean', basePrice: 15000, description: 'Comprehensive residence cleaning.', status: 'Active', imageUrl: 'https://picsum.photos/seed/s1/800/600', categoryId: 'scat1' },
        { id: 's2', title: 'AC Maintenance', basePrice: 5000, description: 'Expert AC servicing.', status: 'Active', imageUrl: 'https://picsum.photos/seed/s2/800/600', categoryId: 'scat2' }
      ];
      services.forEach(s => batch.set(doc(db, 'services', s.id), s));

      // 4. Sub Services
      const subServices = [
        { id: 'sub1', name: 'Standard Room Clean', description: 'Mopping, dusting, and vacuuming.', price: 2000, duration: '1 hr', mainServiceId: 's1' },
        { id: 'sub2', name: 'Kitchen Deep Clean', description: 'Degreasing and sanitizing.', price: 5000, duration: '2 hrs', mainServiceId: 's1' },
        { id: 'sub3', name: 'Bathroom Sanitize', description: 'Toilet and tile scrubbing.', price: 3000, duration: '1 hr', mainServiceId: 's1' },
        { id: 'sub4', name: 'Basic AC Service', description: 'Filter cleaning.', price: 1500, duration: '30 mins', mainServiceId: 's2' },
        { id: 'sub5', name: 'Gas Charge', description: 'Freon refill.', price: 3500, duration: '1 hr', mainServiceId: 's2' }
      ];
      subServices.forEach(ss => batch.set(doc(db, 'sub_services', ss.id), ss));

      await batch.commit();
      toast({ title: "ERP Seeded", description: "Database populated with ERP and Sub-Service data." });
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
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time performance metrics</p>
        </div>
        <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 bg-white font-bold shadow-sm">
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed ERP & Marketing
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all duration-300 bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2.5 rounded-xl transition-colors", stat.bg, stat.color)}><stat.icon size={20} /></div>
                  <div className={cn("flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full", stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
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
          <CardHeader><CardTitle className="text-lg font-bold">Revenue Growth</CardTitle></CardHeader>
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

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
          <CardHeader><CardTitle className="text-lg font-bold relative z-10">Market Insights</CardTitle></CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">Campaign Conversions</span>
                <span className="font-black text-xl">12.4%</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">Coupon Usage</span>
                <span className="font-black text-xl">842</span>
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-black h-12 mt-4 shadow-xl">
               View Marketing Report
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}